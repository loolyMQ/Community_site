# Многоэтапная сборка для оптимизации размера образа

# Этап 1: Сборка клиентского приложения
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код клиента
COPY . .

# Собираем клиентское приложение
RUN npm run build

# Этап 2: Сборка серверного приложения
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Копируем package.json сервера и устанавливаем зависимости
COPY server/package*.json ./
RUN npm ci --only=production

# Копируем исходный код сервера
COPY server/ .

# Компилируем TypeScript
RUN npm run build

# Этап 3: Финальный образ
FROM node:18-alpine AS production

# Устанавливаем необходимые пакеты
RUN apk add --no-cache dumb-init

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Копируем собранные приложения
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/

# Устанавливаем только production зависимости для сервера
WORKDIR /app/server
RUN npm ci --only=production && npm cache clean --force

# Создаем директории для логов
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт
EXPOSE 3001

# Используем dumb-init для корректной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Запускаем сервер
CMD ["node", "dist/index.js"] 