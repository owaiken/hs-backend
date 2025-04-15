# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies
RUN npm install

# Default command to run your bot task poller
CMD ["node", "task-poller.js"]
