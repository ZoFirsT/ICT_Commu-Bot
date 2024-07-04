# Base Image: Start with a lightweight Node.js image
FROM node:18-alpine

# Working Directory: Set up a consistent workspace inside the container
WORKDIR /app

# Copy Package Files: Bring in the dependencies
COPY package*.json ./

# Install Dependencies: Use npm ci for reliable builds
RUN npm ci --production

# Copy Project Files: Transfer the rest of your code
COPY . .


# Start the Bot: Command to run when the container launches
CMD ["node", "index.js"]
