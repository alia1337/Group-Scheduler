# Frontend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for hot reload)
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application (for production)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start the development server (change to serve build for production)
CMD ["npm", "start"]