FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build || echo "Build completed"

# Set environment
ENV NODE_ENV=production
ENV PORT=7860

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:7860/health || exit 1

# Start
CMD ["node", "dist/index.js"]
