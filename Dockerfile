FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy configuration files
COPY tsconfig*.json ./
COPY *.config.* ./

# Copy source code
COPY . .

# Build client and server
RUN npm run build

# Remove devDependencies after build
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]