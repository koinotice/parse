FROM node

# Create app directory
RUN mkdir -p /app
RUN mkdir -p /hash
WORKDIR /app

# Install app dependencies
COPY package.json /app
COPY yarn.lock /app
RUN yarn install
RUN npm install pm2 -g
# Bundle app source
COPY . /app
#RUN yarn build

EXPOSE 80
CMD ["pm2-runtime", "./ecosystem.config.js"]

