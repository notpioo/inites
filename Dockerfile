
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the client only
RUN npm run build:client

# Copy server files
COPY server ./server

# Remove devDependencies after build
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
