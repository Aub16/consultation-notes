FROM node:20-slim
WORKDIR /app
COPY . .
CMD ["npx", "serve", "-s", "front", "-l", "3000"]