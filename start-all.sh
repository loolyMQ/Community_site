#!/bin/bash

# Переходим в директорию проекта
cd "$(dirname "$0")"

echo "🚀 Запускаем сайт сообществ..."

# Проверяем, что порты свободны
echo "🔍 Проверяем доступность портов..."
if lsof -i:3001 >/dev/null 2>&1; then
    echo "❌ Порт 3001 занят. Запустите ./stop-all.sh для остановки процессов"
    exit 1
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo "❌ Порт 5173 занят. Запустите ./stop-all.sh для остановки процессов"
    exit 1
fi

echo "✅ Порты свободны"

# Проверяем, что PostgreSQL запущен
echo "🗄️ Проверяем подключение к PostgreSQL..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL не запущен. Запустите PostgreSQL и попробуйте снова"
    exit 1
fi
echo "✅ PostgreSQL доступен"

# Запускаем сервер в фоновом режиме
echo "📡 Запускаем сервер..."
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Ждем немного, чтобы сервер запустился
echo "⏳ Ждем запуска сервера..."
sleep 5

# Проверяем, что сервер запустился
if ! lsof -i:3001 >/dev/null 2>&1; then
    echo "❌ Сервер не запустился. Проверьте server.log"
    exit 1
fi
echo "✅ Сервер запущен на порту 3001"

# Запускаем фронтенд в фоновом режиме
echo "🎨 Запускаем фронтенд..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Ждем немного, чтобы фронтенд запустился
echo "⏳ Ждем запуска фронтенда..."
sleep 3

# Проверяем, что фронтенд запустился
if ! lsof -i:5173 >/dev/null 2>&1; then
    echo "❌ Фронтенд не запустился. Проверьте frontend.log"
    exit 1
fi
echo "✅ Фронтенд запущен на порту 5173"

# Сохраняем PID процессов
echo $SERVER_PID > server.pid
echo $FRONTEND_PID > frontend.pid

echo "🎉 Все сервисы запущены!"
echo "📊 Статус:"
echo "🌐 Фронтенд: http://localhost:5173"
echo "📡 API: http://localhost:3001"
echo "🔍 Health check: http://localhost:3001/health"
echo ""
echo "📝 Логи:"
echo "   Сервер: tail -f server.log"
echo "   Фронтенд: tail -f frontend.log"
echo ""
echo "🛑 Для остановки: ./stop-all.sh" 