# 🚀 Инструкции по деплою

## Быстрый запуск (5 минут)

### Вариант 1: Vercel + Railway (рекомендуется)

#### Frontend на Vercel:
1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите ваш репозиторий `loolyMQ/Community_site`
5. Настройте:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Добавьте переменную окружения:
   - `VITE_API_URL` = `https://your-railway-app.railway.app/api`
7. Нажмите "Deploy"

#### Backend на Railway:
1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите "New Project" → "Deploy from GitHub repo"
4. Выберите ваш репозиторий
5. Добавьте PostgreSQL базу данных
6. Настройте переменные окружения:
   - `DATABASE_URL` (автоматически)
   - `JWT_SECRET` = `your-super-secret-key-here`
   - `PORT` = `3001`
7. Деплой произойдет автоматически

### Вариант 2: Netlify + Railway

#### Frontend на Netlify:
1. Перейдите на [netlify.com](https://netlify.com)
2. Нажмите "New site from Git"
3. Выберите GitHub и ваш репозиторий
4. Настройте:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Добавьте переменную окружения: `VITE_API_URL`
6. Нажмите "Deploy site"

### Вариант 3: Docker (локально)

```bash
# Клонируйте репозиторий
git clone https://github.com/loolyMQ/Community_site.git
cd Community_site

# Создайте .env файл
cp .env.example .env
# Отредактируйте .env с вашими настройками

# Запустите через Docker
docker-compose up -d

# Сайт будет доступен на http://localhost
```

## Переменные окружения

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_APP_TITLE=Карта студенческих сообществ
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3001
CORS_ORIGIN=https://your-frontend-url.com
```

## Проверка деплоя

1. **Frontend**: Откройте ваш сайт в браузере
2. **Backend**: Проверьте API по адресу `https://your-backend-url.com/api/health`
3. **База данных**: Проверьте подключение через Prisma Studio

## Troubleshooting

### Ошибка сборки
- Проверьте версию Node.js (должна быть 18+)
- Удалите `node_modules` и `package-lock.json`, затем `npm install`

### Ошибка подключения к БД
- Проверьте `DATABASE_URL` в переменных окружения
- Убедитесь, что база данных создана и доступна

### CORS ошибки
- Проверьте `CORS_ORIGIN` в настройках backend
- Убедитесь, что URL указан без слеша в конце

## Поддержка

При возникновении проблем:
1. Проверьте логи в панели управления вашей платформы
2. Обратитесь в [Telegram](https://t.me/a_attuu)
3. Создайте Issue в GitHub репозитории
