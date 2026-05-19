# ProjectPulse — Production Dockerfile
# Single-container: Node.js serves both the API and the frontend static files.

FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy backend dependencies first (layer-cache friendly)
COPY backend/package*.json ./backend/

RUN cd backend && npm install --production

# Copy the full project (frontend + backend)
COPY . .

# Expose the API/frontend port
EXPOSE 3001

# Set production mode
ENV NODE_ENV=production
ENV PORT=3001

# Start the Express server (serves frontend + API)
CMD ["node", "backend/server.js"]
