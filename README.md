# Agent 4 Implementation

A TypeScript implementation of the Agent 4 protocol with multi-LLM fallback support. This project provides a robust framework for building autonomous AI agents with advanced workflow management and fault tolerance.

## Features

- **Multi-LLM Support**: Integrates with multiple LLM providers with automatic fallback
- **Workflow Management**: Implements the 4-phase Agent 4 workflow (PLAN, DISCOVER, EXECUTE, VALIDATE)
- **Fault Tolerance**: Automatic failover between LLM providers
- **REST API**: Easy integration with other services
- **Type Safety**: Built with TypeScript for better developer experience

## Supported LLM Providers

- Continue.dev
- Alibaba Qwen
- Kimi
- CodeCopilot

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for the LLM providers you want to use

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agent4-implementation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and update with your API keys:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your actual API keys.

### Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```
GET /health
```

### Execute Agent 4 Workflow
```
POST /api/agent4/execute
```

**Request Body:**
```json
{
  "task": "Your task description here",
  "context": {
    "any": "additional context"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "...",
    "discovery": {},
    "execution": {},
    "validation": {},
    "metadata": {
      "startTime": 1634567890123,
      "endTime": 1634567890456,
      "provider": "continue",
      "stepsCompleted": ["plan", "discover", "execute", "validate"]
    }
  }
}
```

## Configuration

Edit the `.env` file to configure the application:

```env
# API Keys
CONTINUE_API_KEY=your_continue_api_key
ALIBABA_QWEN_API_KEY=your_alibaba_api_key
KIMI_API_KEY=your_kimi_api_key
CODECOPILOT_KEY=your_codestral_key

# Configuration
NODE_ENV=development
PORT=3000
DEFAULT_LLM_PROVIDER=continue
FALLBACK_ORDER=continue,alibaba,kimi,codestral
```

## Development

### Project Structure

```
src/
  ├── agent4/           # Agent 4 workflow implementation
  │   ├── workflow.ts   # Main workflow logic
  │   └── tools/        # Custom tools for the agent
  ├── llm/              # LLM provider implementations
  │   ├── providers/    # Individual LLM providers
  │   └── fallback.ts   # Fallback mechanism
  ├── config/           # Configuration management
  └── index.ts          # Application entry point
```

### Adding a New LLM Provider

1. Create a new file in `src/llm/providers/` that implements the `LLMProvider` interface
2. Add the provider to the `createProvider` function in `src/llm/providers/index.ts`
3. Update the `.env` file with any required API keys
4. Add the provider to the `FALLBACK_ORDER` in the `.env` file

## Testing

Run tests with:
```bash
npm test
```

## Deployment

### Docker

Build the Docker image:
```bash
docker build -t agent4-implementation .
```

Run the container:
```bash
docker run -p 3000:3000 --env-file .env agent4-implementation
```

### Hugging Face Spaces

1. Push your code to a GitHub repository
2. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
3. Create a new Space and select "Docker" as the SDK
4. Configure the Space to use your repository
5. Add your environment variables in the Space settings

## License

MIT

## Acknowledgements

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Continue.dev](https://continue.dev/)
- [Alibaba Qwen](https://github.com/QwenLM/Qwen)
- [Kimi](https://kimi.moonshot.cn/)
- [CodeCopilot](https://codestral.mistral.ai/)
