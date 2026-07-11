/**
 * start-connectors.js
 * 
 * Start all configured connectors.
 * Connectors run independently and communicate with backend via HTTP.
 */

require('dotenv').config();

const connectorRegistry = require('./src/connectors/connectorRegistry');
const TelegramConnector = require('./src/connectors/telegramConnector');
const MockErpConnector = require('./src/connectors/mockErpConnector');

/**
 * Initialize and start all connectors
 */
async function startConnectors() {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'ConnectorManager',
    message: 'Starting connectors...'
  }));

  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Initialize connectors
  const connectors = [];

  // 1. Telegram Connector (if token provided)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegram = new TelegramConnector({
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      apiBaseUrl: API_BASE_URL
    });
    connectors.push({ id: 'telegram', connector: telegram });
  } else {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service: 'ConnectorManager',
      message: 'TELEGRAM_BOT_TOKEN not found, skipping Telegram connector'
    }));
  }

  // 2. Mock ERP Connector (for testing)
  if (process.env.ENABLE_MOCK_ERP === 'true') {
    const mockErp = new MockErpConnector({
      apiBaseUrl: API_BASE_URL
    });
    connectors.push({ id: 'mock-erp', connector: mockErp });
  }

  // Register and connect all connectors
  for (const { id, connector } of connectors) {
    try {
      // Register in registry
      const registered = connectorRegistry.register(id, connector);
      if (!registered) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          service: 'ConnectorManager',
          message: `Connector ${id} already registered, skipping`
        }));
        continue;
      }

      // Connect
      await connector.connect();

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'ConnectorManager',
        message: `Connector ${id} connected successfully`
      }));

      // Log health status
      const health = await connector.healthCheck();
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'ConnectorManager',
        message: `Connector ${id} health check`,
        health
      }));

    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'ConnectorManager',
        message: `Failed to connect ${id}`,
        error: error.message
      }));
    }
  }

  // Log summary
  const registeredConnectors = connectorRegistry.list();
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'ConnectorManager',
    message: 'All connectors started',
    connectors: registeredConnectors,
    count: registeredConnectors.length
  }));

  // Start periodic health checks
  startHealthCheckMonitor();

  // Start metrics reporting
  startMetricsReporter();
}

/**
 * Monitor connector health periodically
 */
function startHealthCheckMonitor() {
  setInterval(async () => {
    try {
      const healthStatuses = await connectorRegistry.getHealthStatus();
      
      const unhealthyConnectors = healthStatuses.filter(s => !s.healthy);
      
      if (unhealthyConnectors.length > 0) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'warn',
          service: 'ConnectorHealthMonitor',
          message: 'Unhealthy connectors detected',
          unhealthy: unhealthyConnectors.map(c => c.connectorId)
        }));
      } else {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          service: 'ConnectorHealthMonitor',
          message: 'All connectors healthy',
          count: healthStatuses.length
        }));
      }
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'ConnectorHealthMonitor',
        message: 'Health check failed',
        error: error.message
      }));
    }
  }, 60000); // Every 60 seconds
}

/**
 * Report connector metrics periodically
 */
function startMetricsReporter() {
  const connectorMetrics = require('./src/connectors/connectorMetrics');

  setInterval(() => {
    try {
      const allMetrics = connectorMetrics.getAllMetrics();
      
      const summary = {
        totalConnectors: allMetrics.length,
        totalReceived: 0,
        totalSent: 0,
        totalFailed: 0,
        byConnector: {}
      };

      for (const metrics of allMetrics) {
        summary.totalReceived += metrics.messagesReceived;
        summary.totalSent += metrics.messagesSent;
        summary.totalFailed += metrics.failedMessages;
        
        summary.byConnector[metrics.connectorId] = {
          received: metrics.messagesReceived,
          sent: metrics.messagesSent,
          failed: metrics.failedMessages,
          uptime: metrics.uptimeSeconds,
          connected: metrics.connected
        };
      }

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'ConnectorMetricsReporter',
        message: 'Connector metrics',
        metrics: summary
      }));
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'ConnectorMetricsReporter',
        message: 'Metrics reporting failed',
        error: error.message
      }));
    }
  }, 300000); // Every 5 minutes
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'ConnectorManager',
    message: 'Shutting down connectors...'
  }));

  const allConnectors = connectorRegistry.getAll();

  for (const [id, connector] of allConnectors) {
    try {
      await connector.disconnect();
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'ConnectorManager',
        message: `Connector ${id} disconnected`
      }));
    } catch (error) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'ConnectorManager',
        message: `Error disconnecting ${id}`,
        error: error.message
      }));
    }
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'ConnectorManager',
    message: 'All connectors stopped'
  }));

  process.exit(0);
}

// Handle signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start connectors
startConnectors()
  .then(() => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'ConnectorManager',
      message: 'Connector manager is running',
      info: {
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        mockErp: process.env.ENABLE_MOCK_ERP === 'true',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
      }
    }));
  })
  .catch((error) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'ConnectorManager',
      message: 'Failed to start connectors',
      error: error.message
    }));
    process.exit(1);
  });
