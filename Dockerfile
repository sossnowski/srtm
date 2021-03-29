FROM node:12-alpine

ENV NODE_ENV production

WORKDIR /srtm-service

COPY . /srtm-service/

RUN npm install

CMD node index.js
