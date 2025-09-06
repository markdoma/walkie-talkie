# Use official Node.js image as the build environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite app
RUN npm run build

# Use a lightweight web server to serve the built files
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template for Cloud Run $PORT support
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
