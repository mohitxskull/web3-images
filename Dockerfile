FROM library/node:18-alpine

RUN apk update && apk upgrade && apk add --no-cache git

RUN mkdir -p /usr/src/app

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY ./package*.json /usr/src/app
RUN yarn

# Copy app source code
COPY ./ /usr/src/app

# Build app
RUN yarn build

ENV NODE_ENV production

ENV PORT 80

EXPOSE 80

# Start app
CMD ["node", "./build/server.js"]