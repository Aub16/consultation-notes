FROM node:20-slim
WORKDIR /app

# Copie de vos fichiers dans le conteneur
COPY . .

# Lancement de npx serve au démarrage
# Remplacez "." par "dist" ou "build" si vos fichiers finaux sont dans un sous-dossier
CMD ["npx", "serve", "-s", ".", "-l", "3000"]