############################################################
# Dockerfile to build nodjs microservices
# Based on Node 8.8.1
############################################################
# Set the base image to node:8.8.1
FROM node:8.8.1

WORKDIR /app
ADD ./app /app
RUN npm install
EXPOSE 3000
CMD npm start
