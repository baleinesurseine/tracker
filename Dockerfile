FROM node:6
MAINTAINER Edouard Fischer <edouard.fischer@gmail.com>

RUN groupadd -r tracker && useradd -r -g tracker tracker

# Create app directory
RUN mkdir -p /usr/src/app && chown -R tracker:tracker/usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production

# Bundle app source
COPY . /usr/src/app

USER tracker

EXPOSE 6000

CMD [ "node", "server.js" ]
