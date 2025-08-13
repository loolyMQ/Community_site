# 📋 Инструкция по управлению сайтом сообществ

## 🎯 Ответ на ваш вопрос

**Отзывы - это НЕ мок данные, а реальные данные из PostgreSQL базы данных!**

- **Источник**: PostgreSQL база данных `community_graph`
- **Количество**: 116 отзывов
- **Статус**: Опубликованные отзывы (`isPublished = true`)
- **Созданы**: Скриптом `server/scripts/seed-reviews.ts`

## 🚀 Быстрый старт

### 1. Остановка всех процессов
```bash
./stop-all.sh
```

### 2. Запуск всех сервисов
```bash
./start-all.sh
```

### 3. Проверка статуса
```bash
./status.sh
```

## 📊 Что запускается

### Сервисы
- **Фронтенд**: http://localhost:5173 (Vite + React)
- **API сервер**: http://localhost:3001 (Express + TypeScript)
- **База данных**: PostgreSQL на порту 5432

### Данные
- **Отзывы**: 116 штук в базе данных
- **Пользователи**: Тестовые пользователи
- **Сообщества**: Тестовые сообщества

## 🔧 Управление процессами

### Автоматические команды
```bash
# Остановить ВСЕ процессы на портах 3001 и 5173
./stop-all.sh

# Запустить сервер и фронтенд
./start-all.sh

# Проверить статус всех сервисов
./status.sh
```

### Ручные команды (если нужно)
```bash
# Найти процессы на портах
lsof -i :3001
lsof -i :5173

# Убить процессы по PID
kill -9 <PID>

# Или убить все процессы на порту
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

## 📝 Логи и отладка

### Просмотр логов
```bash
# Логи сервера
tail -f server.log

# Логи фронтенда
tail -f frontend.log
```

### Проверка API
```bash
# Health check
curl http://localhost:3001/health

# Проверка отзывов
curl http://localhost:3001/api/reviews/community/[communityId]
```

## 🗄️ База данных

### Подключение
```bash
psql postgresql://artemvedernikov@localhost:5432/community_graph
```

### Полезные запросы
```sql
-- Количество отзывов
SELECT COUNT(*) FROM reviews;

-- Опубликованные отзывы
SELECT COUNT(*) FROM reviews WHERE "isPublished" = true;

-- Примеры отзывов
SELECT rating, content, "createdAt" FROM reviews LIMIT 5;
```

## 🐛 Решение проблем

### Порт занят
```bash
./stop-all.sh
```

### База данных недоступна
```bash
# Проверить PostgreSQL
brew services list | grep postgresql

# Запустить PostgreSQL
brew services start postgresql
```

### Зависимости
```bash
# Фронтенд
npm install

# Сервер
cd server && npm install
```

## 📁 Структура файлов

```
Сайт сообществ/
├── start-all.sh          # Запуск всех сервисов
├── stop-all.sh           # Остановка всех процессов
├── status.sh             # Проверка статуса
├── QUICK_START.md        # Быстрый старт
├── INSTRUCTIONS.md       # Эта инструкция
├── server/               # Backend
│   ├── src/              # Исходный код
│   ├── prisma/           # Схема БД
│   └── scripts/          # Скрипты заполнения
└── src/                  # Frontend
```

## ✅ Готово!

Теперь у вас есть полный контроль над проектом:
- **Один клик** для остановки всех процессов
- **Один клик** для запуска всех сервисов
- **Полная информация** о статусе системы
- **Реальные данные** в базе PostgreSQL 