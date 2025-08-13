#!/bin/bash

# Скрипт для настройки базы данных PostgreSQL
# Использование: ./scripts/setup-db.sh

echo "🔧 Настройка базы данных PostgreSQL для Community Graph..."

# Проверяем, установлен ли PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Пожалуйста, установите PostgreSQL 15 или выше."
    echo "📖 Инструкции по установке: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL найден"

# Проверяем подключение к PostgreSQL
if ! psql -U postgres -c "SELECT 1;" &> /dev/null; then
    echo "❌ Не удается подключиться к PostgreSQL как пользователь 'postgres'"
    echo "💡 Убедитесь, что PostgreSQL запущен и пользователь 'postgres' существует"
    echo "💡 Или измените настройки в .env файлах"
    exit 1
fi

echo "✅ Подключение к PostgreSQL успешно"

# Создаем базу данных
echo "🗄️ Создание базы данных..."
psql -U postgres -c "CREATE DATABASE community_graph;" 2>/dev/null || echo "⚠️ База данных уже существует"

# Проверяем, что база данных создана
if psql -U postgres -d community_graph -c "SELECT 1;" &> /dev/null; then
    echo "✅ База данных 'community_graph' готова к использованию"
else
    echo "❌ Ошибка при создании базы данных"
    exit 1
fi

# Выполняем миграции Prisma
echo "🔄 Выполнение миграций Prisma..."
cd "$(dirname "$0")/.."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Миграции выполнены успешно"
else
    echo "❌ Ошибка при выполнении миграций"
    exit 1
fi

# Генерируем Prisma клиент
echo "🔧 Генерация Prisma клиента..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma клиент сгенерирован"
else
    echo "❌ Ошибка при генерации Prisma клиента"
    exit 1
fi

echo ""
echo "🎉 Настройка базы данных завершена успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите сервер: cd server && npm run dev"
echo "2. Запустите клиент: npm run dev"
echo "3. Откройте http://localhost:5173 в браузере"
echo ""
echo "🔧 Для просмотра базы данных используйте:"
echo "   npx prisma studio" 