#!/bin/bash

echo "🚀 Starting Community Graph Server..."

# Показываем содержимое директории
echo "📁 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Ждем подключения к базе данных
echo "⏳ Waiting for database connection..."
sleep 5

# Проверяем, что CSV файл существует
echo "📄 Checking CSV file..."
if [ -f "communities_data.csv" ]; then
    echo "✅ CSV file found"
    echo "📊 CSV file size: $(wc -l < communities_data.csv) lines"
else
    echo "❌ CSV file not found"
    echo "📁 Looking for CSV in parent directory..."
    if [ -f "../communities_data.csv" ]; then
        echo "✅ CSV file found in parent directory"
        cp ../communities_data.csv .
    else
        echo "❌ CSV file not found anywhere"
    fi
fi

# Запускаем миграции Prisma
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Генерируем Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Инициализируем базу данных (если нужно)
echo "🌱 Initializing database with communities data..."
npx ts-node scripts/init-database.ts

# Запускаем сервер
echo "🌐 Starting server..."
npm start
