FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

WORKDIR /home/user

COPY _app.tsx pages/_app.tsx

RUN npm install posthog-js

# Copier le dossier asupp dans l'image
COPY asupp ./asupp

# Installer les dépendances dans asupp
RUN cd ./asupp && npm install

