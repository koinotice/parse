FROM node:10-alpine as builder

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN apk --no-cache add python make g++ git

COPY package*.json ./
RUN npm install
RUN npm install pm2 -g

# The instructions for second stage
FROM node:10-alpine

WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules

COPY . .



EXPOSE 80
CMD ["pm2-runtime", "./ecosystem.config.js"]

