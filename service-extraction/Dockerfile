FROM node:18-alpine

WORKDIR /app

COPY util-json/ /app/util-json/
WORKDIR /app/util-json
RUN npm install

WORKDIR /app
COPY service-extraction/package*.json ./
RUN npm install
RUN npm install --save ./util-json

COPY service-extraction/ ./

EXPOSE 8002

CMD ["node", "server.js"]