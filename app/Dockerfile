FROM node:8
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY ecosystem.config.js .

RUN npm install --production
RUN npm install pm2 -g
#RUN ls -al -R
# If you are building your code for production
# RUN npm install --only=production
# Bundle app source
#RUN apk add --no-cache bash
#COPY . .
EXPOSE 5555
# CMD [ "npm", "start" ]
CMD ["pm2-runtime", "ecosystem.config.js", "--web"]
#CMD ["pm2-runtime", "start", "ecosystem.config.js", "--web", 1234]
#CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]