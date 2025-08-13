# 🏠 Интеграция с home.mephi

## 📋 Обзор

Система поддерживает интеграцию с home.mephi для аутентификации пользователей и получения их данных. В настоящее время реализована заглушка, которую можно легко заменить на реальную интеграцию.

## 🔧 Быстрое включение/выключение

### Включение интеграции:
```typescript
// В файле src/services/homeMephiService.ts
const ENABLE_HOME_MEPHI_INTEGRATION = true; // Включить интеграцию
```

### Включение через консоль браузера:
```javascript
// В консоли браузера
homeMephiService.toggleIntegration();
```

## 🏗️ Архитектура

### Файлы интеграции:
- `src/services/homeMephiService.ts` - основной сервис интеграции
- `server/prisma/schema.prisma` - поля в базе данных
- `src/components/AddReviewForm.tsx` - форма с поддержкой home.mephi
- `src/components/AdminReviews.tsx` - отображение данных в админке

### Поля в базе данных:

#### User модель:
```sql
homeMephiUserId       String?  @unique // ID пользователя в home.mephi
homeMephiFirstName    String?  // Имя из home.mephi
homeMephiLastName     String?  // Фамилия из home.mephi
homeMephiMiddleName   String?  // Отчество из home.mephi
homeMephiToken        String?  // Токен доступа к home.mephi
homeMephiTokenExpires DateTime? // Срок действия токена
```

#### Review модель:
```sql
homeMephiUserId       String?  // ID пользователя в home.mephi
homeMephiFirstName    String?  // Имя (видно в админке даже для анонимных)
homeMephiLastName     String?  // Фамилия
homeMephiMiddleName   String?  // Отчество
homeMephiFaculty      String?  // Факультет
homeMephiCourse       Int?     // Курс
homeMephiGroup        String?  // Группа
homeMephiStudentId    String?  // Студенческий билет
```

## 🎯 Функциональность

### ✅ Что работает сейчас (заглушка):
- Аутентификация через home.mephi (мок)
- Получение данных пользователя (мок)
- Сохранение данных в отзывы
- Отображение в админке (даже для анонимных отзывов)
- Поддержка анонимных отзывов с сохранением данных

### 🔄 Что нужно реализовать:
- Реальная аутентификация через home.mephi API
- Получение реальных данных пользователей
- Валидация токенов home.mephi
- Обновление токенов

## 🚀 API endpoints для реализации

### Аутентификация:
```typescript
// POST https://home.mephi.ru/api/auth/login
{
  "email": "user@mephi.ru",
  "password": "password"
}

// Response:
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@mephi.ru",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": "Иванович",
    "faculty": "Институт интеллектуальных кибернетических систем",
    "course": 3,
    "group": "ИКБО-01-21",
    "studentId": "12345678"
  },
  "token": "jwt-token"
}
```

### Получение профиля:
```typescript
// GET https://home.mephi.ru/api/user/profile
// Headers: Authorization: Bearer {token}

// Response:
{
  "success": true,
  "user": {
    // те же поля, что и выше
  }
}
```

### Валидация токена:
```typescript
// GET https://home.mephi.ru/api/auth/validate
// Headers: Authorization: Bearer {token}

// Response:
{
  "valid": true,
  "expiresAt": "2025-08-12T22:00:00Z"
}
```

## 🔒 Безопасность

### Анонимные отзывы:
- Пользователь может оставить анонимный отзыв
- Данные из home.mephi сохраняются в базе
- В админке администраторы видят полное имя пользователя
- Для обычных пользователей отзыв остается анонимным

### Токены:
- Токены home.mephi хранятся в базе данных
- Автоматическое обновление токенов при истечении
- Безопасная передача токенов через HTTPS

## 🛠️ Разработка

### Тестовые данные:
```typescript
// В homeMephiService.ts есть мок пользователи:
{
  'test@mephi.ru': {
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: 'Иванович',
    faculty: 'Институт интеллектуальных кибернетических систем',
    course: 3,
    group: 'ИКБО-01-21',
    studentId: '12345678'
  }
}
```

### Отладка:
```javascript
// В консоли браузера
console.log(homeMephiService.getIntegrationStatus());
homeMephiService.toggleIntegration();
```

## 📝 TODO для полной интеграции

1. **Реальная аутентификация:**
   - Заменить мок на реальные API вызовы
   - Обработать ошибки аутентификации
   - Добавить refresh токены

2. **Валидация токенов:**
   - Проверка срока действия
   - Автоматическое обновление
   - Обработка недействительных токенов

3. **Обработка ошибок:**
   - Сетевые ошибки
   - Ошибки API
   - Fallback на локальную аутентификацию

4. **Кэширование:**
   - Кэширование данных пользователей
   - Оптимизация запросов

5. **Тестирование:**
   - Unit тесты для сервиса
   - Integration тесты с API
   - E2E тесты

## 🔗 Ссылки

- **Home.mephi API**: https://home.mephi.ru/api
- **Документация API**: (нужно получить от команды home.mephi)
- **Схема базы данных**: `server/prisma/schema.prisma`
- **Сервис интеграции**: `src/services/homeMephiService.ts`
