# Étape 1 : Construction avec Node.js
FROM node:20-alpine AS builder
WORKDIR /app
# Copie des fichiers de configuration pour installer les dépendances
COPY package*.json ./
RUN npm install
# Copie du reste du code et compilation
COPY . .
RUN npm run build 

# Étape 2 : Serveur web Nginx
FROM nginx:alpine
# Récupération uniquement des fichiers compilés de l'étape 1
COPY --from=builder /app/dist /usr/share/nginx/html