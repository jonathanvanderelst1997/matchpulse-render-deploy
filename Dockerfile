FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV MATCHPULSE_SERVE_STATIC=1
ENV HOST=0.0.0.0
ENV PORT=10000

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/src/data.js ./src/data.js
COPY --from=build /app/dist ./dist

EXPOSE 10000
CMD ["node", "server/api.mjs"]
