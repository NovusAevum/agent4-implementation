# MCP Server Configuration for Agent 4

## Overview

Agent 4 uses Model Context Protocol (MCP) servers to extend capabilities. This guide shows how to configure MCP servers in Windsurf.

## Windsurf MCP Configuration

### Location
Add MCP server configurations to Windsurf settings:
```
/Users/wmh/Library/Application Support/Windsurf/User/settings.json
```

### Current Configuration
Your existing MCP server:
```json
{
  "mcpServers": {
    "enterprise": {
      "command": "npx",
      "env": {},
      "args": [
        "-y",
        "github:NovusAevum/enterprise-mcp-server"
      ]
    }
  }
}
```

## Agent 4 MCP Servers

### Recommended MCP Servers for Agent 4

#### 1. Filesystem MCP Server
Provides advanced file operations.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/wmh"
      ]
    }
  }
}
```

#### 2. GitHub MCP Server
Integrates with GitHub repositories.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

#### 3. Shell MCP Server
Provides shell command execution.

```json
{
  "mcpServers": {
    "shell": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-shell"
      ]
    }
  }
}
```

#### 4. AWS Bedrock MCP Server
Integrates with AWS Bedrock for AI capabilities.

```json
{
  "mcpServers": {
    "bedrock": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-aws-bedrock"
      ],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "your-access-key",
        "AWS_SECRET_ACCESS_KEY": "your-secret-key"
      }
    }
  }
}
```

#### 5. Promptz MCP Server
Enterprise prompt management.

```json
{
  "mcpServers": {
    "promptz": {
      "command": "npx",
      "args": [
        "-y",
        "@promptz/mcp"
      ],
      "env": {
        "PROMPTZ_API_KEY": "your-promptz-api-key"
      }
    }
  }
}
```

### Complete Agent 4 MCP Configuration

Add this to your Windsurf `settings.json`:

```json
{
  "mcpServers": {
    "enterprise": {
      "command": "npx",
      "env": {},
      "args": [
        "-y",
        "github:NovusAevum/enterprise-mcp-server"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/wmh"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "shell": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-shell"
      ]
    },
    "promptz": {
      "command": "npx",
      "args": [
        "-y",
        "@promptz/mcp"
      ],
      "env": {
        "PROMPTZ_API_KEY": "${env:PROMPTZ_API_KEY}"
      }
    }
  }
}
```

## Environment Variables

Create a `.env` file or set system environment variables:

```bash
# GitHub Integration
export GITHUB_TOKEN="ghp_your_github_token_here"

# Promptz Integration
export PROMPTZ_API_KEY="a2-45yiufdo5rcflbas7rzd3twble"

# AWS Bedrock (if using)
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
```

## MCP Server Features

### Filesystem Server
- Read/write files
- List directories
- Search files
- File metadata

### GitHub Server
- Repository operations
- Pull requests
- Issues
- Code search

### Shell Server
- Execute commands
- Environment management
- Process control

### Enterprise Server
- Custom business logic
- Advanced workflows
- Integration capabilities

### Promptz Server
- Prompt management
- Template library
- Version control
- Team collaboration

## Verification

After adding MCP servers, verify they're working:

1. Restart Windsurf
2. Open Cascade chat
3. Check MCP server status in settings
4. Test a simple operation with each server

## Troubleshooting

### Server Not Starting
```bash
# Check if npx is available
which npx

# Test server manually
npx -y @modelcontextprotocol/server-filesystem /Users/wmh
```

### Permission Issues
```bash
# Ensure proper permissions
chmod +x ~/.npm/_npx/*
```

### Environment Variables Not Loading
```bash
# Add to shell profile (~/.zshrc or ~/.bashrc)
export GITHUB_TOKEN="your_token"
source ~/.zshrc
```

## Custom MCP Server (Optional)

If you want to create a custom Agent 4 MCP server:

### Package Structure
```
agent4-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── server/
│       └── app.ts
└── dist/
```

### Basic Implementation
```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'agent4-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Add your custom tools here
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'agent4_plan',
        description: 'Execute PLAN phase',
        inputSchema: {
          type: 'object',
          properties: {
            request: { type: 'string' }
          }
        }
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Usage in Windsurf
```json
{
  "mcpServers": {
    "agent4-custom": {
      "command": "node",
      "args": [
        "/path/to/agent4-mcp-server/dist/index.js"
      ]
    }
  }
}
```

## Best Practices

1. **Use environment variables** for sensitive data
2. **Test servers individually** before combining
3. **Monitor server logs** for errors
4. **Keep servers updated** with `npx -y`
5. **Document custom servers** for team use
6. **Use version pinning** for production

## Security Considerations

- Never commit API keys to version control
- Use environment variables for credentials
- Limit filesystem access to necessary directories
- Review MCP server permissions regularly
- Use fine-grained GitHub tokens
- Rotate credentials periodically

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Windsurf MCP Guide](https://windsurf.com/editor/mcp)
