# Groq Service - Infrastructure Layer

Production-grade integration with Groq API.

## Overview

`groqService.js` is a pure infrastructure layer that handles all communication with Groq's LLM API. It provides reliability, observability, and error resilience without any business logic.

## Features

✅ **Automatic Retry** - Exponential backoff with jitter  
✅ **Timeout Handling** - Configurable request timeouts  
✅ **Error Categorization** - Structured error types  
✅ **Structured Logging** - JSON logs for observability  
✅ **Health Check** - API connectivity verification  
✅ **Input Validation** - Prevents invalid requests  

## Usage

### 1. Initialize Service

```javascript
const groqService = require('./services/groqService');

// Must call once before use
groqService.initialize();
```

### 2. Generate Completion

```javascript
const systemPrompt = 'You are a helpful assistant.';
const userPrompt = 'What is 2+2?';

try {
  const response = await groqService.generate(systemPrompt, userPrompt, {
    temperature: 0.1,
    maxTokens: 1000,
    jsonMode: true,
    timeout: 30000
  });
  
  console.log('Response:', response);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

### 3. Health Check

```javascript
const health = await groqService.healthCheck();

if (health.healthy) {
  console.log(`API OK (${health.latency}ms)`);
} else {
  console.error(`API Down: ${health.message}`);
}
```

## API Reference

### `initialize()`

Initializes the Groq client with API key from `.env`.

**Throws**: Error if `GROQ_API_KEY` is not configured

```javascript
groqService.initialize();
```

---

### `generate(systemPrompt, userPrompt, options)`

Generates completion with automatic retry.

**Parameters**:
- `systemPrompt` (string) - System instructions
- `userPrompt` (string) - User message
- `options` (object) - Optional configuration
  - `temperature` (number) - 0-2, default: 0.1
  - `maxTokens` (number) - Max response length, default: 2000
  - `jsonMode` (boolean) - Force JSON output, default: true
  - `timeout` (number) - Request timeout in ms, default: 30000

**Returns**: Promise<string> - Raw response content

**Throws**: Error after all retries exhausted

```javascript
const response = await groqService.generate(
  'You are a JSON API.',
  'Return {"status": "ok"}',
  { temperature: 0, maxTokens: 100 }
);
```

---

### `healthCheck()`

Verifies API connectivity and measures latency.

**Returns**: Promise<Object>
- `healthy` (boolean) - Service status
- `message` (string) - Status description
- `latency` (number) - Response time in ms
- `error` (string) - Error category if unhealthy

```javascript
const { healthy, latency } = await groqService.healthCheck();
```

## Configuration

Default configuration in constructor:

```javascript
{
  maxRetries: 3,          // Number of retry attempts
  retryDelay: 1000,       // Initial retry delay (ms)
  timeout: 30000,         // Request timeout (ms)
  defaultTemperature: 0.1,
  defaultMaxTokens: 2000
}
```

## Retry Logic

### Retryable Errors
- HTTP 429 (Rate Limit)
- HTTP 500, 502, 503, 504 (Server Errors)
- Timeout errors
- Network errors (ECONNRESET, ETIMEDOUT)

### Retry Strategy
- Exponential backoff: 1s → 2s → 4s
- Random jitter to prevent thundering herd
- Maximum delay capped at 10 seconds

### Non-Retryable Errors
- HTTP 401 (Authentication)
- HTTP 400 (Bad Request)
- Validation errors

## Error Handling

Errors are categorized for easier handling:

```javascript
try {
  await groqService.generate(systemPrompt, userPrompt);
} catch (error) {
  console.log('Category:', error.category);
  // authentication | rate_limit | server_error | timeout | unknown
}
```

### Error Categories

| Category | Cause | Action |
|----------|-------|--------|
| `authentication` | Invalid API key | Check `.env` configuration |
| `rate_limit` | Too many requests | Implement rate limiting |
| `server_error` | Groq API issues | Retry later |
| `timeout` | Slow response | Increase timeout |
| `unknown` | Other errors | Check logs |

## Logging

All operations are logged in JSON format:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "service": "GroqService",
  "message": "[groq_123_abc] Starting generation",
  "systemPromptLength": 500,
  "userPromptLength": 100,
  "temperature": 0.1,
  "maxTokens": 2000
}
```

### Log Levels
- `info` - Normal operations
- `warn` - Warnings (e.g., already initialized)
- `error` - Failures and retries

## Examples

### Example 1: Basic Usage

```javascript
const groqService = require('./services/groqService');

groqService.initialize();

const response = await groqService.generate(
  'You are a helpful assistant.',
  'Hello!',
  { temperature: 0.7 }
);

console.log(response);
```

### Example 2: JSON Mode

```javascript
const response = await groqService.generate(
  'You are a JSON API. Always respond with valid JSON.',
  'Return user data for ID 123',
  { jsonMode: true }
);

const data = JSON.parse(response);
console.log(data);
```

### Example 3: Error Handling

```javascript
try {
  const response = await groqService.generate(systemPrompt, userPrompt);
  console.log('Success:', response);
} catch (error) {
  if (error.category === 'rate_limit') {
    console.log('Rate limited. Waiting...');
    await sleep(5000);
    // Retry
  } else {
    console.error('Failed:', error.message);
  }
}
```

### Example 4: Health Check Integration

```javascript
async function startServer() {
  groqService.initialize();
  
  const health = await groqService.healthCheck();
  
  if (!health.healthy) {
    console.error('Groq API unavailable. Exiting.');
    process.exit(1);
  }
  
  console.log(`Groq API ready (${health.latency}ms latency)`);
  // Start server...
}
```

## Testing

### Manual Test

```javascript
// test-groq.js
const groqService = require('./src/services/groqService');

async function test() {
  groqService.initialize();
  
  // Test 1: Health check
  console.log('Testing health...');
  const health = await groqService.healthCheck();
  console.log('Health:', health);
  
  // Test 2: Generate
  console.log('Testing generation...');
  const response = await groqService.generate(
    'You are a test bot.',
    'Say hello in JSON format',
    { maxTokens: 50 }
  );
  console.log('Response:', response);
}

test().catch(console.error);
```

Run with:
```bash
node test-groq.js
```

## Common Issues

### Issue: "GROQ_API_KEY not configured"
**Solution**: Add your API key to `backend/.env`:
```
GROQ_API_KEY=your_actual_key_here
```

### Issue: "GroqService not initialized"
**Solution**: Call `initialize()` before using:
```javascript
groqService.initialize();
```

### Issue: Rate limit exceeded
**Solution**: Implement rate limiting in your application:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 60000, max: 10 });
app.use('/api', limiter);
```

### Issue: Timeout errors
**Solution**: Increase timeout:
```javascript
groqService.generate(systemPrompt, userPrompt, {
  timeout: 60000 // 60 seconds
});
```

## Architecture Notes

### Why Singleton?
The service is exported as a singleton to ensure:
- Single client instance (connection pooling)
- Shared configuration
- Consistent logging

### Why No Business Logic?
This service is infrastructure only. Business logic belongs in:
- **Planner Agent** - Decision making
- **Tools** - Business operations
- **Workflow Engine** - Orchestration

### Integration Points
```
Planner Agent
    ↓
groqService.generate()
    ↓
Groq API
```

The service is used exclusively by the Planner Agent to generate decisions.

## Performance

- **Latency**: ~200-500ms per request (70B model)
- **Throughput**: Limited by Groq API rate limits
- **Retry overhead**: Adds 1-15 seconds on failures

## Security

- API key stored in `.env` (not in code)
- Input validation prevents injection
- Error messages don't leak sensitive data
- Logs don't include prompts/responses (only metadata)

---

**Status**: ✅ Production Ready  
**Dependencies**: `groq-sdk`, `dotenv`  
**Model**: `llama-3.3-70b-versatile`  
**Next**: Implement Planner Agent using this service
