#!/bin/bash

echo "🚀 Starting Community Graph Server..."

# Ждем подключения к базе данных
echo "⏳ Waiting for database connection..."
sleep 5

# Запускаем миграции Prisma
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Генерируем Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Запускаем сервер
echo "🌐 Starting server..."
npm start
