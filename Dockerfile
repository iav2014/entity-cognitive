FROM node:9.2.0

COPY package.json /home/app/
WORKDIR /home/app
COPY package*.json ./

RUN npm install --only=production
# If you are building your code for production
# RUN npm install --only=production
# Bundle app source
COPY . .
EXPOSE 3443
CMD [ "npm", "start" ]
