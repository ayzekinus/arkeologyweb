# Build (Vite)
FROM node:20-alpine AS build
WORKDIR /app

# IMPORTANT:
# Some environments set npm "production" config true, which omits devDependencies.
# Vite lives in devDependencies, so we force production=false for the build stage.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package.json package-lock.json* ./
# Deterministic install if lock exists; fallback to install if not.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# Run (nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
