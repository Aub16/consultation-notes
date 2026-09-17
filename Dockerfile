FROM node:20-slim
WORKDIR /app
COPY . .
CMD ["npx", "serve", "front", "-l", "3000"]