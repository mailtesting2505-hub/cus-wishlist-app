FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --include=dev && \
    ROLLUP_VERSION=$(node -p "require('./node_modules/rollup/package.json').version") && \
    npm install --no-save "@rollup/rollup-linux-x64-musl@$ROLLUP_VERSION" && \
    npm cache clean --force

COPY . .

RUN npm run build

CMD ["npm", "run", "docker-start"]
