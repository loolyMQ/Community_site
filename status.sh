#!/bin/bash

echo "📊 Статус сервисов сайта сообществ"
echo "=================================="

# Проверяем порты
echo ""
echo "🔌 Проверка портов:"
if lsof -i:3001 >/dev/null 2>&1; then
    echo "✅ Порт 3001 (сервер): Занят"
    lsof -i:3001 | grep LISTEN
else
    echo "❌ Порт 3001 (сервер): Свободен"
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo "✅ Порт 5173 (фронтенд): Занят"
    lsof -i:5173 | grep LISTEN
else
    echo "❌ Порт 5173 (фронтенд): Свободен"
fi

# Проверяем PostgreSQL
echo ""
echo "🗄️ Проверка базы данных:"
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL: Доступен"
    
    # Проверяем количество отзывов в базе
    REVIEW_COUNT=$(psql postgresql://artemvedernikov@localhost:5432/community_graph -t -c "SELECT COUNT(*) FROM reviews;" 2>/dev/null | xargs)
    if [ ! -z "$REVIEW_COUNT" ]; then
        echo "📝 Отзывов в базе: $REVIEW_COUNT"
    else
        echo "❌ Не удалось получить количество отзывов"
    fi
else
    echo "❌ PostgreSQL: Недоступен"
fi

# Проверяем API
echo ""
echo "🔍 Проверка API:"
if lsof -i:3001 >/dev/null 2>&1; then
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ API сервер: Работает"
        echo "🔗 Health check: http://localhost:3001/health"
    else
        echo "⚠️ API сервер: Запущен, но не отвечает"
    fi
else
    echo "❌ API сервер: Не запущен"
fi

# Проверяем фронтенд
echo ""
echo "🎨 Проверка фронтенда:"
if lsof -i:5173 >/dev/null 2>&1; then
    echo "✅ Фронтенд: Работает"
    echo "🔗 URL: http://localhost:5173"
else
    echo "❌ Фронтенд: Не запущен"
fi

# Проверяем логи
echo ""
echo "📝 Логи:"
if [ -f "server.log" ]; then
    echo "✅ server.log: Существует"
    echo "   Последние строки:"
    tail -3 server.log | sed 's/^/   /'
else
    echo "❌ server.log: Не найден"
fi

if [ -f "frontend.log" ]; then
    echo "✅ frontend.log: Существует"
    echo "   Последние строки:"
    tail -3 frontend.log | sed 's/^/   /'
else
    echo "❌ frontend.log: Не найден"
fi

echo ""
echo "🛠️ Команды управления:"
echo "   Запуск: ./start-all.sh"
echo "   Остановка: ./stop-all.sh"
echo "   Статус: ./status.sh" 