# React Native Metro Bundler Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache bash git openssh curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactnative -u 1001

# Change ownership
RUN chown -R reactnative:nodejs /usr/src/app
USER reactnative

# Expose ports for Metro and Expo
EXPOSE 8081 19000 19001 19002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8081/status || exit 1

# Start Metro bundler
CMD ["npm", "start"]

