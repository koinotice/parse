FROM keymetrics/pm2:latest-alpine

RUN npm config set unsafe-perm true

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
#
#RUN apk add --update python krb5 krb5-libs gcc make g++ krb5-dev git
# Expose the listening port of your app
EXPOSE 8000

WORKDIR /app

COPY package.json .
COPY ecosystem.config.js .

#RUN npm install --production
# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]

