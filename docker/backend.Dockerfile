# Backend Dockerfile - Node.js Express API
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy backend source code
COPY backend ./backend
COPY package.json ./

# Expose port
EXPOSE 5555

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "backend/server.js"]

