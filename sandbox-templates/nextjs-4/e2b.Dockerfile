# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
# Copier le dossier my-app dans l'image Docker
COPY my-app /home/user/my-app

WORKDIR /home/user/my-app

# Installer les dépendances
RUN npm install