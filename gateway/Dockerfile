FROM node:18-alpine

WORKDIR /app

COPY ./util-json/ /app/util-json/
WORKDIR /app/util-json
RUN npm install

WORKDIR /app
COPY ./gateway/package*.json ./
RUN npm install
RUN npm install --save ./util-json

COPY ./gateway/ ./

EXPOSE 8000

CMD ["node", "server.js"]