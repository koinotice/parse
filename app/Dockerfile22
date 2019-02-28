FROM node:alpine as builder

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN apk --no-cache add python make g++ git
ENV NPM_CONFIG_UNSAFE_PERM=true
COPY package*.json ./
RUN npm install



# The instructions for second stage
FROM node:alpine

# Install pm2
RUN npm install pm2 -g

WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules

COPY . .



EXPOSE 80
CMD ["pm2-runtime", "./ecosystem.config.js"]

