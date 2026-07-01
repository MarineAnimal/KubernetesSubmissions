FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY writer.js .
COPY reader.js .

EXPOSE 3000




CMD ["node", "reader.js"]