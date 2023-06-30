FROM node:alpine

WORKDIR /bot

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]