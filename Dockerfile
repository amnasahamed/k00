# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install
RUN npm install axios

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Setup the Node.js Backend
FROM node:18-alpine
WORKDIR /app

# Install dependencies strictly required for runtime and native module compilation
RUN apk add --no-cache curl python3 make g++

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-build /app/frontend/dist ./dist

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the port the app runs on
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server.js"]
