FROM node:alpine

WORKDIR /bot

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]