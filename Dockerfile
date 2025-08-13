FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json из server
COPY server/package*.json ./server/

# Переходим в папку server
WORKDIR /app/server

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем исходный код server
COPY server/ ./

# Собираем приложение
RUN npm run build

# Удаляем devDependencies после сборки
RUN npm prune --production

# Открываем порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Запускаем приложение
CMD ["npm", "start"] 