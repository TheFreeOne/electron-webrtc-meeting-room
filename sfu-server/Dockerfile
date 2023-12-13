# only test , do not use 

FROM node:16-buster

WORKDIR /app

COPY ./ /app

RUN rm /usr/bin/python

RUN cp /usr/bin/python3 /usr/bin/python

RUN wget http://bootstrap.pypa.io/get-pip.py

RUN /usr/bin/python3 get-pip.py

RUN npm i -g typescript

RUN npm install

EXPOSE 3016

CMD  node /app/server.js


# FROM python:3.7.3


# RUN wget https://nodejs.org/dist/v10.16.0/node-v10.16.0-linux-x64.tar.xz &&\
#     tar xf node-v10.16.0-linux-x64.tar.xz -C /opt/
# ENV PATH=$PATH:/opt/node-v10.16.0-linux-x64/bin

# WORKDIR /app

# COPY ./ /app

# RUN npm install

# EXPOSE 3016

# CMD  node /app/server.js