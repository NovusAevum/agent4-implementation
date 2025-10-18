# Stage 1: Install dependencies and build the application
FROM --platform=$BUILDPLATFORM node:18-slim AS builder

# Set the working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies including devDependencies for building
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r myuser && useradd -r -g myuser myuser \
    && mkdir -p /home/myuser/app \
    && chown -R myuser:myuser /home/myuser

# Switch to non-root user
USER myuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# Copy package files and install only production dependencies
COPY --chown=myuser:myuser package*.json ./
RUN npm ci --only=production --omit=dev --no-audit --prefer-offline

# Copy built files from builder
COPY --chown=myuser:myuser --from=builder /app/dist ./dist

# Copy other necessary files
COPY --chown=myuser:myuser .env.example .env
COPY --chown=myuser:myuser huggingface.yaml ./

# Create a health check endpoint
RUN echo 'const express = require("express"); const app = express(); app.get("/health", (req, res) => res.json({ status: "ok" })); app.listen(8080);' > health.js

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:7860/health || exit 1

# Expose the port the app runs on
EXPOSE 7860

# Command to run the application
CMD ["node", "dist/index.js"]
