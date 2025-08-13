# 🚀 Быстрый запуск сайта сообществ

## 📋 Требования

- Node.js 18+
- PostgreSQL
- npm или yarn

## 🛠️ Управление сервисами

### Автоматические скрипты

Проект содержит готовые скрипты для управления:

```bash
# Запуск всех сервисов
./start-all.sh

# Остановка всех сервисов
./stop-all.sh

# Проверка статуса
./status.sh
```

### Ручное управление

Если нужно запустить сервисы вручную:

```bash
# 1. Запуск сервера (в отдельном терминале)
cd server
npm run dev

# 2. Запуск фронтенда (в отдельном терминале)
npm run dev
```

## 🔍 Проверка работы

После запуска проверьте:

- **Фронтенд**: http://localhost:5173
- **API**: http://localhost:3001
- **Health check**: http://localhost:3001/health

## 📊 База данных

### Отзывы
- **Источник**: PostgreSQL база данных
- **Количество**: ~116 отзывов (тестовые данные)
- **Статус**: Опубликованные отзывы (`isPublished = true`)

### Проверка данных
```bash
# Подключение к базе
psql postgresql://artemvedernikov@localhost:5432/community_graph

# Количество отзывов
SELECT COUNT(*) FROM reviews;

# Примеры отзывов
SELECT rating, content, "isPublished" FROM reviews LIMIT 5;
```

## 🐛 Решение проблем

### Порт занят
```bash
# Остановить все процессы
./stop-all.sh

# Или найти и убить процесс вручную
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### База данных недоступна
```bash
# Проверить статус PostgreSQL
brew services list | grep postgresql

# Запустить PostgreSQL
brew services start postgresql
```

### Зависимости не установлены
```bash
# Установить зависимости фронтенда
npm install

# Установить зависимости сервера
cd server && npm install
```

## 📝 Логи

- **Сервер**: `server.log`
- **Фронтенд**: `frontend.log`

Просмотр логов в реальном времени:
```bash
tail -f server.log
tail -f frontend.log
```

## 🔧 Конфигурация

### Переменные окружения
- **Сервер**: `server/.env`
- **Фронтенд**: `env.client`

### Порты
- **Фронтенд**: 5173
- **Сервер**: 3001
- **PostgreSQL**: 5432

## 📚 Дополнительная информация

- **Документация**: `README.md`
- **API маршруты**: `server/src/routes/`
- **Схема БД**: `server/prisma/schema.prisma` 