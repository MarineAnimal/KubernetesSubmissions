FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json ./
RUN npm install --omit=dev

# Copy the controller source.
COPY src ./src

USER node

CMD ["node", "src/index.js"]
