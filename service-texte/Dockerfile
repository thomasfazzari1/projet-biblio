FROM node:18-alpine

WORKDIR /app

COPY util-json/ /app/util-json/
WORKDIR /app/util-json
RUN npm install

WORKDIR /app
COPY service-texte/package*.json ./
RUN npm install
RUN npm install --save ./util-json

COPY service-texte/ ./

CMD ["node", "server.js"]