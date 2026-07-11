/**
 * telegramConnector.js
 * 
 * Telegram Bot connector implementation.
 * Communicates with backend ONLY through HTTP POST /api/connector/message
 * 
 * NEVER imports:
 * - WorkflowRuntime
 * - Planner
 * - Tools
 * - Repositories
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const Connector = require('./connector.interface');
const connectorMetrics = require('./connectorMetrics');

class TelegramConnector extends Connector {
  constructor(config = {}) {
    super({
      connectorId: 'telegram',
      ...config
    });

    this.botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.apiBaseUrl = config.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
    this.bot = null;
    
    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      delays: [500, 1000, 2000] // Exponential backoff
    };
  }

  /**
   * Connect to Telegram Bot API
   */
  async connect() {
    if (!this.botToken) {
      throw new Error('Telegram bot token not provided');
    }

    try {
      // Create bot with long polling
      this.bot = new TelegramBot(this.botToken, { polling: true });

      // Register message handler
      this.bot.on('message', (msg) => this.handleIncomingMessage(msg));

      // Register error handler
      this.bot.on('polling_error', (error) => {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          service: 'TelegramConnector',
          message: 'Polling error',
          error: error.message
        }));
      });

      this.connected = true;
      connectorMetrics.updateStatus(this.connectorId, true);

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'TelegramConnector',
        message: 'Connected to Telegram Bot API'
      }));
    } catch (error) {
      this.connected = false;
      connectorMetrics.updateStatus(this.connectorId, false);
      throw error;
    }
  }

  /**
   * Disconnect from Telegram Bot API
   */
  async disconnect() {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
    }

    this.connected = false;
    connectorMetrics.updateStatus(this.connectorId, false);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'TelegramConnector',
      message: 'Disconnected from Telegram Bot API'
    }));
  }

  /**
   * Handle incoming Telegram message
   * @private
   */
  async handleIncomingMessage(msg) {
    try {
      this.incrementReceived();
      connectorMetrics.recordReceived(this.connectorId);
      this.heartbeat();
      connectorMetrics.heartbeat(this.connectorId);

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'TelegramConnector',
        message: 'Message received',
        chatId: msg.chat.id,
        from: msg.from.username
      }));

      // Normalize message
      const normalizedMessage = this.normalizeInbound(msg);

      // Send to backend API with retry
      const response = await this.sendToBackend(normalizedMessage);

      // Send response back to Telegram
      if (response && response.result && response.result.responseMessage) {
        await this.sendMessage(
          normalizedMessage.channelId,
          response.result.responseMessage
        );
      }
    } catch (error) {
      this.incrementFailed();
      connectorMetrics.recordFailed(this.connectorId);

      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'TelegramConnector',
        message: 'Failed to handle message',
        error: error.message
      }));

      // Send error message to user
      try {
        await this.bot.sendMessage(
          msg.chat.id,
          'Sorry, I encountered an error processing your message. Please try again.'
        );
      } catch (sendError) {
        console.error('Failed to send error message to user:', sendError);
      }
    }
  }

  /**
   * Send normalized message to backend API with retry
   * @private
   * @param {Object} normalizedMessage - Normalized message
   * @returns {Promise<Object>} Backend response
   */
  async sendToBackend(normalizedMessage) {
    const url = `${this.apiBaseUrl}/api/connector/message`;
    let lastError = null;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          service: 'TelegramConnector',
          message: `Sending to backend (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`,
          url
        }));

        const response = await axios.post(url, normalizedMessage, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.error?.message || 'Backend returned error');
        }
      } catch (error) {
        lastError = error;

        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          service: 'TelegramConnector',
          message: `Backend request failed (attempt ${attempt + 1})`,
          error: error.message
        }));

        // Wait before retry (exponential backoff)
        if (attempt < this.retryConfig.maxRetries - 1) {
          const delay = this.retryConfig.delays[attempt];
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Backend request failed after ${this.retryConfig.maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(channelId, message) {
    try {
      await this.bot.sendMessage(channelId, message);
      this.incrementSent();
      connectorMetrics.recordSent(this.connectorId);

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'TelegramConnector',
        message: 'Message sent',
        chatId: channelId
      }));
    } catch (error) {
      this.incrementFailed();
      connectorMetrics.recordFailed(this.connectorId);
      throw error;
    }
  }

  /**
   * Send file to Telegram
   */
  async sendFile(channelId, fileUrl, caption) {
    try {
      await this.bot.sendDocument(channelId, fileUrl, {
        caption: caption || ''
      });
      this.incrementSent();
      connectorMetrics.recordSent(this.connectorId);

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'TelegramConnector',
        message: 'File sent',
        chatId: channelId,
        fileUrl
      }));
    } catch (error) {
      this.incrementFailed();
      connectorMetrics.recordFailed(this.connectorId);
      throw error;
    }
  }

  /**
   * Normalize Telegram message to standard format
   */
  normalizeInbound(telegramMessage) {
    return {
      connectorId: this.connectorId,
      workflowId: `workflow_telegram_${telegramMessage.chat.id}`,
      channelId: telegramMessage.chat.id.toString(),
      senderId: telegramMessage.from.id.toString(),
      senderName: telegramMessage.from.username || telegramMessage.from.first_name || 'User',
      text: telegramMessage.text || '',
      attachments: this.extractAttachments(telegramMessage),
      receivedAt: new Date(telegramMessage.date * 1000).toISOString()
    };
  }

  /**
   * Extract attachments from Telegram message
   * @private
   */
  extractAttachments(telegramMessage) {
    const attachments = [];

    if (telegramMessage.document) {
      attachments.push({
        type: 'document',
        fileId: telegramMessage.document.file_id,
        fileName: telegramMessage.document.file_name,
        mimeType: telegramMessage.document.mime_type,
        fileSize: telegramMessage.document.file_size
      });
    }

    if (telegramMessage.photo) {
      const photo = telegramMessage.photo[telegramMessage.photo.length - 1]; // Get largest photo
      attachments.push({
        type: 'photo',
        fileId: photo.file_id,
        fileSize: photo.file_size
      });
    }

    return attachments;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.bot) {
        return {
          healthy: false,
          message: 'Bot not initialized'
        };
      }

      const me = await this.bot.getMe();
      
      return {
        healthy: true,
        botInfo: {
          id: me.id,
          username: me.username,
          firstName: me.first_name
        },
        connected: this.connected
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Sleep utility for retry backoff
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TelegramConnector;
