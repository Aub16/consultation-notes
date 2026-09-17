FROM node:20-slim
WORKDIR /app/front
COPY . .
CMD ["npx", "serve", "-l", "3000"]