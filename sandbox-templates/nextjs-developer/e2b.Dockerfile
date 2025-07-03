# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@15.3.4 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir
COPY _app.tsx pages/_app.tsx
# COPY globals.css styles/globals.css

RUN npm install tailwindcss @tailwindcss/postcss postcss

RUN npx shadcn@2.7.0 init -b neutral
RUN npx shadcn@2.7.0 add --all
RUN npm install posthog-js

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
