# Frontend: Vite dev server (proxies /api and /ws to backend)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Proxy target is set at runtime via VITE_PROXY_TARGET (e.g. http://backend:8000)
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
