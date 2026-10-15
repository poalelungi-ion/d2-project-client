# syntax=docker/dockerfile:1

# Two ways to run this client, from one file:
#
#   docker build --target dev .   -> Vite dev server on 5173, hot reload
#   docker build .                -> type-checked production bundle on nginx
#
# The default target is the production one, so the image published to the
# registry is a static build rather than a dev server.

# ---- deps: install once; both the dev and build stages start from here ----
FROM node:20-alpine AS deps
WORKDIR /app
# Copy the lockfile too, so npm ci can install the exact pinned tree.
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: the Vite dev server, type-checking as you edit ----
FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- build: `tsc -b` first, then the Vite bundle ----
FROM deps AS build
WORKDIR /app
# Vite inlines VITE_-prefixed variables at BUILD time, so the API the bundle
# talks to is fixed here and cannot be changed by the running container.
# Override with: docker build --build-arg VITE_API_BASE_URL=https://api.example/api
#
# There is no API token to bake in any more: the app authenticates per user
# through its sign-in screen, so nothing secret ends up in the bundle.
ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
# `npm run build` is `tsc -b && vite build`: a type error fails the image.
RUN npm run build

# ---- production: nginx serving the built assets ----
FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh
COPY --from=build /app/dist /usr/share/nginx/html
# 5173 rather than 80 so the published port matches the dev target and the
# compose files that already expose it.
EXPOSE 5173
