# Build
FROM node:20-alpine AS build
WORKDIR /app

# Ensure devDependencies (vite, tailwind, etc.) are installed during image build
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package.json package-lock.json* ./
RUN npm ci --include=dev || npm install --include=dev
COPY . .
RUN npm run build

# Run (nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
