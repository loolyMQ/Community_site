# Настройка переменных окружения на Vercel

## Проблема
Фронтенд на Vercel пытается обратиться к `localhost:3001`, который недоступен из интернета.

## Решение
Нужно настроить переменную окружения `VITE_API_URL` на Vercel.

## Шаги настройки:

### 1. Найдите URL вашего Railway backend
1. Зайдите на [railway.app](https://railway.app)
2. Найдите ваш проект
3. Скопируйте URL (например: `https://your-app.railway.app`)

### 2. Настройте переменную на Vercel
1. Зайдите на [vercel.com](https://vercel.com)
2. Найдите ваш проект `community-site-fv12`
3. Перейдите в Settings → Environment Variables
4. Добавьте переменную:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-railway-app.railway.app/api`
   - **Environment**: Production, Preview, Development
5. Нажмите "Save"
6. Перезапустите деплой

### 3. Проверьте настройки
После настройки:
- Фронтенд будет обращаться к правильному API
- Редактирование сообществ будет работать
- Авторизация в админ панели будет работать

## Учетные данные для админ панели:
- **Email**: `admin@community-site.ru`
- **Password**: `:h]a2#l|Wx}u?U^i$%@1`

## Модераторы:
- `moderator1@community-site.ru` / `r!t_1rSg{}aFtwd,ISIF`
- `moderator2@community-site.ru` / `Q?+d||R-q8z53$H@:+TG`
- `moderator3@community-site.ru` / `)2L$T5V!V%vD_L,wn=|7`
- `moderator4@community-site.ru` / `oQ2MLYHbXNA+jJD2CTM|`
