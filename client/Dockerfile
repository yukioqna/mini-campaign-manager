# Build stage — compile the Vite React app
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY client/package.json ./client/
WORKDIR /app/client
RUN yarn install --frozen-lockfile

COPY client/ ./
RUN yarn build

# Runtime stage — serve with nginx
FROM nginx:alpine

# Remove default nginx.conf and replace with ours
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
