# use docker node 14.18.1
FROM node:14.18.1-buster

# FROM npm:6.14.15


# FROM python:3.9.8


# create a directory to run docker
WORKDIR /app

# copy package.json into the new directory
# COPY package.json /app

# install the dependencies
RUN npm install

# copy all other files and folder into the app directory
COPY . /app

# open port 3016
EXPOSE 3016

#CMD find / -name node

CMD rm -rf /usr/bin/python

CMD cp /usr/bin/python3  usr/bin/python 

# run the server
CMD  node /app/server.js
