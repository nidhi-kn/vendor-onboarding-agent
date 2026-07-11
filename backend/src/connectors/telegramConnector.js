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

const { TelegramBot } = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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

      // Normalize message (now async to handle file downloads)
      const normalizedMessage = await this.normalizeInbound(msg);

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
  async normalizeInbound(telegramMessage) {
    return {
      connectorId: this.connectorId,
      workflowId: `workflow_telegram_${telegramMessage.chat.id}`,
      channelId: telegramMessage.chat.id.toString(),
      senderId: telegramMessage.from.id.toString(),
      senderName: telegramMessage.from.username || telegramMessage.from.first_name || 'User',
      text: telegramMessage.text || '',
      attachments: await this.extractAttachments(telegramMessage),
      receivedAt: new Date(telegramMessage.date * 1000).toISOString()
    };
  }

  /**
   * Download file from Telegram and save to local disk
   * Note: In production, this would upload to object storage (S3-equivalent).
   * Local disk is used as a scoped-down substitute for the assignment window.
   * @private
   * @param {string} fileId - Telegram file ID
   * @returns {Promise<Object>} Object with localPath, fileName, mimeType
   */
  async downloadTelegramFile(fileId) {
    try {
      // Get file info from Telegram
      const file = await this.bot.getFile(fileId);
      const filePath = file.file_path;

      // Build download URL
      const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;

      // Ensure uploads directory exists (at backend root, sibling to package.json)
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Extract file extension and name
      const originalFileName = path.basename(filePath);
      const fileExt = path.extname(originalFileName);
      const baseFileName = path.basename(originalFileName, fileExt);

      // Generate unique filename with UUID prefix to avoid collisions
      const uniqueFileName = `${uuidv4()}-${baseFileName}${fileExt}`;
      const localPath = path.join(uploadsDir, uniqueFileName);

      // Download file
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 60000 // 60 second timeout for large files
      });

      // Pipe to file
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'TelegramConnector',
        message: 'File downloaded successfully',
        fileId,
        localPath
      }));

      return {
        localPath: localPath,
        fileName: originalFileName,
        mimeType: response.headers['content-type'] || 'application/octet-stream'
      };
    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'TelegramConnector',
        message: 'Failed to download Telegram file',
        fileId,
        error: error.message
      }));
      throw error;
    }
  }

  /**
   * Extract attachments from Telegram message
   * Downloads files and returns attachment objects with url field
   * @private
   */
  async extractAttachments(telegramMessage) {
    const attachments = [];

    // Handle documents
    if (telegramMessage.document) {
      const doc = telegramMessage.document;
      const fileSize = doc.file_size || 0;

      // Size guard: skip if exceeds 10MB for documents
      if (fileSize > 10 * 1024 * 1024) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          service: 'TelegramConnector',
          message: 'Document exceeds 10MB limit, skipping',
          fileId: doc.file_id,
          fileSize
        }));
      } else {
        try {
          // Download the file
          const downloadedFile = await this.downloadTelegramFile(doc.file_id);

          attachments.push({
            type: 'document',
            fileId: doc.file_id,
            fileName: doc.file_name || downloadedFile.fileName,
            mimeType: doc.mime_type || downloadedFile.mimeType,
            fileSize: fileSize,
            url: downloadedFile.localPath
          });
        } catch (error) {
          // Log error but don't crash - vendor should still get a reply
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            service: 'TelegramConnector',
            message: 'Failed to download document, skipping attachment',
            fileId: doc.file_id,
            error: error.message
          }));
        }
      }
    }

    // Handle photos
    if (telegramMessage.photo) {
      const photo = telegramMessage.photo[telegramMessage.photo.length - 1]; // Get largest photo
      const fileSize = photo.file_size || 0;

      // Size guard: skip if exceeds 20MB for photos
      if (fileSize > 20 * 1024 * 1024) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          service: 'TelegramConnector',
          message: 'Photo exceeds 20MB limit, skipping',
          fileId: photo.file_id,
          fileSize
        }));
      } else {
        try {
          // Download the file
          const downloadedFile = await this.downloadTelegramFile(photo.file_id);

          attachments.push({
            type: 'photo',
            fileId: photo.file_id,
            fileName: downloadedFile.fileName,
            mimeType: downloadedFile.mimeType,
            fileSize: fileSize,
            url: downloadedFile.localPath
          });
        } catch (error) {
          // Log error but don't crash - vendor should still get a reply
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            service: 'TelegramConnector',
            message: 'Failed to download photo, skipping attachment',
            fileId: photo.file_id,
            error: error.message
          }));
        }
      }
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
