FROM node:18-alpine

WORKDIR /app

# Copy the lockfile too, so npm ci can install the exact pinned tree.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Serves the Vite dev server, which is what the compose stack expects on 5173.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
