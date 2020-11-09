FROM node:12-alpine

ENV NODE_ENV production
ENV PORT 4444

WORKDIR /srtm-service

COPY . /srtm-service/

RUN npm install

CMD node index.js
