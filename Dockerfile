FROM node:6
MAINTAINER Edouard Fischer <edouard.fischer@gmail.com>

RUN groupadd -r edouard && edouard -r -g edouard edouard

# Create app directory
RUN mkdir -p /usr/src/app && chown -R edouard:edouard /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production

# Bundle app source
COPY . /usr/src/app

USER edouard

EXPOSE 6000

CMD [ "node", "server.js" ]
