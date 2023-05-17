FROM node:alpine

WORKDIR /usr/src/bot

COPY package*.json ./

RUN npm install

COPY . .

RUN npm build

CMD ["npm", "start"]