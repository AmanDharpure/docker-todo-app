FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

RUN npm install

# Copy application source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]