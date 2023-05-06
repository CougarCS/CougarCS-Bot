FROM node:alpine

WORKDIR /usr/src/bot

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "build"]

CMD ["npm", "start"]