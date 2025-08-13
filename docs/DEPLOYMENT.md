# Инструкции по деплою

## 🚀 Быстрый старт

### 1. Подготовка проекта

```bash
# Установка зависимостей
npm install
cd server && npm install

# Сборка frontend
npm run build
```

### 2. Деплой Backend (Railway)

1. **Регистрация на Railway**
   - Зайдите на [railway.app](https://railway.app)
   - Войдите через GitHub

2. **Создание проекта**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий

3. **Настройка переменных окружения**
   ```
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_secret_key_here
   PORT=3001
   NODE_ENV=production
   ```

4. **Настройка базы данных**
   - Добавьте PostgreSQL плагин
   - Скопируйте DATABASE_URL в переменные окружения
   - Выполните миграции: `npx prisma migrate deploy`

5. **Получение URL**
   - Скопируйте URL вашего приложения (например: `https://your-app.railway.app`)

### 3. Деплой Frontend (Vercel)

1. **Регистрация на Vercel**
   - Зайдите на [vercel.com](https://vercel.com)
   - Войдите через GitHub

2. **Импорт проекта**
   - Нажмите "New Project"
   - Выберите ваш репозиторий
   - Настройте:
     - Framework Preset: Vite
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: dist

3. **Настройка переменных окружения**
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   VITE_APP_TITLE=Карта студенческих сообществ
   VITE_FEATURE_REQUESTS=false
   ```

4. **Деплой**
   - Нажмите "Deploy"
   - Дождитесь завершения сборки

### 4. Настройка домена (опционально)

1. **Покупка домена**
   - Купите домен на Namecheap, GoDaddy или другом регистраторе

2. **Настройка DNS**
   - Добавьте A-запись: `@` → `76.76.19.19` (Vercel)
   - Добавьте CNAME-запись: `www` → `your-app.vercel.app`

3. **Подключение к Vercel**
   - В настройках проекта добавьте ваш домен
   - Настройте SSL сертификат

## 🔧 Альтернативные платформы

### Backend
- **Heroku** - классический выбор
- **DigitalOcean App Platform** - простой деплой
- **AWS Elastic Beanstalk** - для продвинутых пользователей

### Frontend
- **Netlify** - альтернатива Vercel
- **GitHub Pages** - для простых проектов
- **Firebase Hosting** - от Google

## 📊 Мониторинг

### Railway
- Логи приложения
- Метрики производительности
- Мониторинг базы данных

### Vercel
- Аналитика посещений
- Производительность
- Ошибки в реальном времени

## 🔒 Безопасность

1. **Переменные окружения**
   - Никогда не коммитьте `.env` файлы
   - Используйте секреты в настройках платформы

2. **База данных**
   - Регулярно делайте бэкапы
   - Используйте SSL соединения

3. **JWT токены**
   - Используйте длинные секретные ключи
   - Настройте время жизни токенов

## 🚨 Устранение неполадок

### Ошибки сборки
```bash
# Проверка TypeScript ошибок
npm run lint

# Очистка кэша
rm -rf node_modules package-lock.json
npm install
```

### Ошибки базы данных
```bash
# Проверка подключения
npx prisma db pull

# Сброс миграций
npx prisma migrate reset
```

### Ошибки CORS
- Проверьте настройки CORS в backend
- Убедитесь, что домен frontend добавлен в разрешенные

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Railway/Vercel
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к базе данных
4. Обратитесь к документации платформ


