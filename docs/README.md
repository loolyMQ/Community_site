# Community Graph Platform / Платформа графов сообществ

[English](#english) | [Русский](#russian)

---

## English

### Overview
A comprehensive web application for visualizing and managing university communities with an interactive graph-based interface. The platform enables users to explore community relationships, discover collaborations, and manage community data through an intuitive visual interface.

### Technology Stack & Detailed Rationale

#### Frontend Architecture

**React 18 + TypeScript**
- **Why chosen**: Type safety prevents runtime errors, component reusability enables modular development, and React's virtual DOM provides optimal performance for dynamic graph updates
- **Benefits**: Automatic type checking, better IDE support, easier refactoring, and improved code maintainability
- **Alternatives considered**: Vue.js with Composition API (similar performance but smaller ecosystem), Angular (overkill for this scale)

**Vite**
- **Why chosen**: Lightning-fast hot module replacement (HMR) is crucial for interactive graph development where immediate feedback is essential
- **Benefits**: Instant HMR, optimized bundling, built-in TypeScript support, superior to Create React App in development speed and bundle size
- **Performance**: 10-100x faster than webpack-based tools

**D3.js + Three.js**
- **Why chosen**: D3 provides maximum flexibility for customizing interactive graph elements and excellent performance with large datasets
- **D3.js benefits**: 
  - Precise control over graph rendering and interactions
  - Excellent performance with large datasets (1000+ nodes)
  - Rich ecosystem of graph algorithms and layouts
  - Custom physics simulation capabilities
- **Three.js benefits**: Hardware acceleration for 3D visualization, WebGL rendering
- **Alternatives considered**: Cytoscape.js (better for static graphs but limited customization), vis.js (simpler but less flexible)

**Tailwind CSS**
- **Why chosen**: Utility-first approach accelerates development of complex interfaces
- **Benefits**: Smaller final CSS size through tree-shaking, rapid prototyping, consistent design system
- **Performance**: Reduces CSS bundle size by 60-80% compared to traditional CSS

#### Backend Architecture

**Node.js + Express**
- **Why chosen**: Single language (JavaScript/TypeScript) for frontend and backend reduces development complexity
- **Benefits**: Excellent I/O performance for real-time graph updates, rich npm ecosystem, easy horizontal scaling
- **Express benefits**: Minimalistic, flexible, easily extensible with middleware, perfect for REST APIs
- **Alternatives considered**: Fastify (better performance but smaller ecosystem), NestJS (better structure but overkill)

**PostgreSQL + Prisma**
- **Why chosen**: ACID compliance is critical for community data integrity, complex query support for analytics
- **PostgreSQL benefits**:
  - ACID transactions ensure data consistency
  - Excellent read-heavy performance for graph queries
  - Built-in JSON support for flexible community metadata
  - Advanced indexing for graph traversal optimization
- **Prisma benefits**: Type-safe ORM with automatic type generation, versioned migrations, excellent TypeScript integration
- **Database schema**: Optimized for graph queries with proper indexing on relationship fields

**JWT Authentication**
- **Why chosen**: Stateless authentication enables horizontal scaling without shared session storage
- **Benefits**: No server-side state, easy microservice integration, built-in expiration handling
- **Security**: Token-based with refresh mechanism, rate limiting on endpoints

**Redis**
- **Why chosen**: In-memory caching for graph data and session storage
- **Benefits**: Sub-millisecond response times, support for complex data structures, built-in TTL
- **Use cases**: Caching graph layouts, session storage, rate limiting counters

#### Development & Deployment

**Docker + Docker Compose**
- **Why chosen**: Consistent development and production environments
- **Benefits**: Easy scaling, dependency isolation, simplified deployment
- **Architecture**: Multi-stage builds for optimized production images

**Nginx**
- **Why chosen**: High-performance reverse proxy and static file serving
- **Benefits**: Built-in gzip compression, load balancing, SSL termination
- **Configuration**: Optimized for single-page application routing

**Jest + Testing Library**
- **Why chosen**: Zero-config for React apps, excellent performance, built-in coverage
- **Benefits**: Testing Library focuses on user behavior, follows React testing best practices
- **Coverage**: Unit tests for utilities, integration tests for API endpoints

### Graph Architecture & Implementation

#### Graph Data Structure
```typescript
interface CommunityNode {
  id: string;
  name: string;
  type: 'academic' | 'research' | 'social' | 'professional';
  size: number; // Number of members
  position: { x: number; y: number; z?: number };
  properties: {
    description: string;
    tags: string[];
    founded: Date;
    members: number;
    rating: number;
  };
}

interface CommunityEdge {
  source: string;
  target: string;
  type: 'collaboration' | 'membership' | 'partnership';
  weight: number; // Relationship strength
  properties: {
    description: string;
    startDate: Date;
    projects: string[];
  };
}
```

#### Physics Simulation
- **Force-directed layout**: Uses D3's force simulation with custom physics
- **Spatial partitioning**: O(n log n) performance instead of O(n²) for large graphs
- **Collision detection**: Prevents node overlap with configurable padding
- **Zoom and pan**: Smooth interactions with performance optimization

#### Graph Rendering Pipeline
1. **Data loading**: Fetch communities and relationships from PostgreSQL
2. **Layout calculation**: Apply force-directed algorithm with physics simulation
3. **Rendering**: Use D3 for SVG-based rendering with WebGL acceleration
4. **Interaction handling**: Mouse events, zoom, pan, node selection
5. **Animation**: Smooth transitions for layout changes and data updates

### Database Design & Community Management

#### Database Schema

**Communities Table**
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  founded_date DATE,
  member_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships Table**
```sql
CREATE TABLE community_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_community_id UUID REFERENCES communities(id),
  target_community_id UUID REFERENCES communities(id),
  relationship_type VARCHAR(50) NOT NULL,
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Reviews Table**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Database Optimizations
- **Indexing**: B-tree indexes on frequently queried fields (name, type, tags)
- **JSONB indexing**: GIN indexes on metadata fields for complex queries
- **Partitioning**: Time-based partitioning for reviews table
- **Connection pooling**: Optimized database connections for concurrent requests

#### Graph Query Optimization
```sql
-- Efficient graph traversal query
WITH RECURSIVE community_graph AS (
  SELECT id, name, type, 0 as depth
  FROM communities 
  WHERE id = $1
  
  UNION ALL
  
  SELECT c.id, c.name, c.type, cg.depth + 1
  FROM communities c
  JOIN community_relationships cr ON c.id = cr.target_community_id
  JOIN community_graph cg ON cr.source_community_id = cg.id
  WHERE cg.depth < 3
)
SELECT * FROM community_graph;
```

### Performance Optimizations

#### Frontend Optimizations
- **React.memo**: Prevents unnecessary re-renders of graph components
- **useMemo**: Caches expensive graph calculations
- **Virtual scrolling**: Handles large lists efficiently
- **Lazy loading**: Loads graph data on demand
- **Web Workers**: Offloads physics calculations to background threads

#### Backend Optimizations
- **Database indexing**: Optimized queries for graph traversal
- **Caching**: Redis caching for frequently accessed graph data
- **Connection pooling**: Efficient database connection management
- **Rate limiting**: Prevents API abuse
- **Compression**: Gzip compression for API responses

#### Graph-Specific Optimizations
- **Spatial partitioning**: Reduces physics calculation complexity from O(n²) to O(n log n)
- **Level-of-detail**: Shows simplified graph for large datasets
- **Progressive loading**: Loads graph data in chunks
- **Viewport culling**: Only renders visible graph elements

### Security Implementation

#### Input Validation
- **Zod schemas**: Type-safe validation for all API inputs
- **SQL injection prevention**: Parameterized queries with Prisma
- **XSS protection**: Content sanitization and CSP headers

#### Authentication & Authorization
- **JWT tokens**: Secure stateless authentication
- **Role-based access**: Different permissions for users, admins, moderators
- **Rate limiting**: Prevents API abuse and DoS attacks

#### Data Protection
- **HTTPS enforcement**: All communications encrypted
- **CSRF protection**: Tokens for form submissions
- **Input sanitization**: Prevents malicious data injection

### Scalability Architecture

#### Horizontal Scaling
- **Load balancer**: Distributes requests across multiple app instances
- **Database read replicas**: Separates read and write operations
- **Redis clustering**: Distributed caching and session storage
- **CDN integration**: Static asset delivery optimization

#### Microservices Ready
- **API-first design**: RESTful endpoints for service integration
- **Event-driven architecture**: Kafka/RabbitMQ for async communication
- **Service discovery**: Dynamic service registration and discovery
- **Circuit breakers**: Fault tolerance for external dependencies

---

## Русский

### Обзор
Комплексное веб-приложение для визуализации и управления университетскими сообществами с интерактивным графовым интерфейсом. Платформа позволяет пользователям исследовать связи между сообществами, находить коллаборации и управлять данными сообществ через интуитивный визуальный интерфейс.

### Технологический стек и детальное обоснование

#### Архитектура фронтенда

**React 18 + TypeScript**
- **Почему выбрано**: Типобезопасность предотвращает ошибки времени выполнения, переиспользование компонентов обеспечивает модульную разработку, виртуальный DOM React обеспечивает оптимальную производительность для динамических обновлений графа
- **Преимущества**: Автоматическая проверка типов, лучшая поддержка IDE, упрощенный рефакторинг, улучшенная поддерживаемость кода
- **Рассмотренные альтернативы**: Vue.js с Composition API (схожая производительность, но меньшая экосистема), Angular (избыточен для данного масштаба)

**Vite**
- **Почему выбрано**: Мгновенная горячая замена модулей (HMR) критична для разработки интерактивных графов, где важна немедленная обратная связь
- **Преимущества**: Мгновенный HMR, оптимизированный бандлинг, встроенная поддержка TypeScript, превосходит Create React App по скорости разработки и размеру бандла
- **Производительность**: В 10-100 раз быстрее инструментов на основе webpack

**D3.js + Three.js**
- **Почему выбрано**: D3 предоставляет максимальную гибкость для кастомизации интерактивных элементов графа и отличную производительность с большими наборами данных
- **Преимущества D3.js**:
  - Точный контроль над рендерингом и взаимодействиями графа
  - Отличная производительность с большими наборами данных (1000+ узлов)
  - Богатая экосистема алгоритмов графов и макетов
  - Возможности кастомной физической симуляции
- **Преимущества Three.js**: Аппаратное ускорение для 3D визуализации, WebGL рендеринг
- **Рассмотренные альтернативы**: Cytoscape.js (лучше для статических графов, но ограниченная кастомизация), vis.js (проще, но менее гибкий)

**Tailwind CSS**
- **Почему выбрано**: Utility-first подход ускоряет разработку сложных интерфейсов
- **Преимущества**: Меньший размер финального CSS через tree-shaking, быстрый прототипинг, консистентная система дизайна
- **Производительность**: Уменьшает размер CSS бандла на 60-80% по сравнению с традиционным CSS

#### Архитектура бэкенда

**Node.js + Express**
- **Почему выбрано**: Единый язык (JavaScript/TypeScript) для фронтенда и бэкенда снижает сложность разработки
- **Преимущества**: Отличная производительность I/O для обновлений графа в реальном времени, богатая экосистема npm, легкое горизонтальное масштабирование
- **Преимущества Express**: Минималистичный, гибкий, легко расширяется middleware, идеален для REST API
- **Рассмотренные альтернативы**: Fastify (лучшая производительность, но меньшая экосистема), NestJS (лучшая структура, но избыточен)

**PostgreSQL + Prisma**
- **Почему выбрано**: ACID-совместимость критична для целостности данных сообществ, поддержка сложных запросов для аналитики
- **Преимущества PostgreSQL**:
  - ACID-транзакции обеспечивают консистентность данных
  - Отличная производительность для read-heavy нагрузок при запросах графа
  - Встроенная поддержка JSON для гибких метаданных сообществ
  - Продвинутая индексация для оптимизации обхода графа
- **Преимущества Prisma**: Типобезопасный ORM с автоматической генерацией типов, версионированные миграции, отличная интеграция с TypeScript
- **Схема БД**: Оптимизирована для запросов графа с правильной индексацией полей отношений

**JWT Аутентификация**
- **Почему выбрано**: Stateless аутентификация обеспечивает горизонтальное масштабирование без общего хранилища сессий
- **Преимущества**: Отсутствие состояния на сервере, легкая интеграция микросервисов, встроенная обработка истечения срока действия
- **Безопасность**: Токен-базированная с механизмом обновления, ограничение скорости на endpoints

**Redis**
- **Почему выбрано**: In-memory кэширование для данных графа и хранение сессий
- **Преимущества**: Время отклика менее миллисекунды, поддержка сложных структур данных, встроенный TTL
- **Применение**: Кэширование макетов графа, хранение сессий, счетчики ограничения скорости

#### Разработка и развертывание

**Docker + Docker Compose**
- **Почему выбрано**: Консистентные окружения разработки и продакшена
- **Преимущества**: Легкое масштабирование, изоляция зависимостей, упрощенное развертывание
- **Архитектура**: Многоэтапные сборки для оптимизированных продакшн образов

**Nginx**
- **Почему выбрано**: Высокопроизводительный обратный прокси и раздача статических файлов
- **Преимущества**: Встроенное gzip сжатие, балансировка нагрузки, SSL терминация
- **Конфигурация**: Оптимизирована для роутинга single-page приложения

**Jest + Testing Library**
- **Почему выбрано**: Zero-config для React приложений, отличная производительность, встроенный coverage
- **Преимущества**: Testing Library фокусируется на пользовательском поведении, следует лучшим практикам тестирования React
- **Coverage**: Unit тесты для утилит, интеграционные тесты для API endpoints

### Архитектура графа и реализация

#### Структура данных графа
```typescript
interface CommunityNode {
  id: string;
  name: string;
  type: 'academic' | 'research' | 'social' | 'professional';
  size: number; // Количество участников
  position: { x: number; y: number; z?: number };
  properties: {
    description: string;
    tags: string[];
    founded: Date;
    members: number;
    rating: number;
  };
}

interface CommunityEdge {
  source: string;
  target: string;
  type: 'collaboration' | 'membership' | 'partnership';
  weight: number; // Сила связи
  properties: {
    description: string;
    startDate: Date;
    projects: string[];
  };
}
```

#### Физическая симуляция
- **Force-directed layout**: Использует force simulation D3 с кастомной физикой
- **Пространственное разделение**: Производительность O(n log n) вместо O(n²) для больших графов
- **Обнаружение столкновений**: Предотвращает перекрытие узлов с настраиваемым отступом
- **Зум и панорамирование**: Плавные взаимодействия с оптимизацией производительности

#### Пайплайн рендеринга графа
1. **Загрузка данных**: Получение сообществ и отношений из PostgreSQL
2. **Расчет макета**: Применение force-directed алгоритма с физической симуляцией
3. **Рендеринг**: Использование D3 для SVG-базированного рендеринга с WebGL ускорением
4. **Обработка взаимодействий**: События мыши, зум, панорамирование, выбор узлов
5. **Анимация**: Плавные переходы для изменений макета и обновлений данных

### Дизайн базы данных и управление сообществами

#### Схема базы данных

**Таблица Сообществ**
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  founded_date DATE,
  member_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Таблица Отношений**
```sql
CREATE TABLE community_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_community_id UUID REFERENCES communities(id),
  target_community_id UUID REFERENCES communities(id),
  relationship_type VARCHAR(50) NOT NULL,
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Таблица Отзывов**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  user_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Оптимизации базы данных
- **Индексация**: B-tree индексы на часто запрашиваемых полях (name, type, tags)
- **JSONB индексация**: GIN индексы на полях метаданных для сложных запросов
- **Партиционирование**: Временное партиционирование для таблицы отзывов
- **Connection pooling**: Оптимизированные соединения БД для конкурентных запросов

#### Оптимизация запросов графа
```sql
-- Эффективный запрос обхода графа
WITH RECURSIVE community_graph AS (
  SELECT id, name, type, 0 as depth
  FROM communities 
  WHERE id = $1
  
  UNION ALL
  
  SELECT c.id, c.name, c.type, cg.depth + 1
  FROM communities c
  JOIN community_relationships cr ON c.id = cr.target_community_id
  JOIN community_graph cg ON cr.source_community_id = cg.id
  WHERE cg.depth < 3
)
SELECT * FROM community_graph;
```

### Оптимизации производительности

#### Оптимизации фронтенда
- **React.memo**: Предотвращает ненужные перерендеры компонентов графа
- **useMemo**: Кэширует дорогие вычисления графа
- **Виртуальная прокрутка**: Эффективно обрабатывает большие списки
- **Ленивая загрузка**: Загружает данные графа по требованию
- **Web Workers**: Выносит физические вычисления в фоновые потоки

#### Оптимизации бэкенда
- **Индексация БД**: Оптимизированные запросы для обхода графа
- **Кэширование**: Redis кэширование для часто используемых данных графа
- **Connection pooling**: Эффективное управление соединениями БД
- **Rate limiting**: Предотвращает злоупотребление API
- **Сжатие**: Gzip сжатие для ответов API

#### Граф-специфичные оптимизации
- **Пространственное разделение**: Снижает сложность физических вычислений с O(n²) до O(n log n)
- **Уровень детализации**: Показывает упрощенный граф для больших наборов данных
- **Прогрессивная загрузка**: Загружает данные графа частями
- **Viewport culling**: Рендерит только видимые элементы графа

### Реализация безопасности

#### Валидация входных данных
- **Zod схемы**: Типобезопасная валидация для всех входных данных API
- **Предотвращение SQL инъекций**: Параметризованные запросы с Prisma
- **Защита от XSS**: Санитизация контента и CSP заголовки

#### Аутентификация и авторизация
- **JWT токены**: Безопасная stateless аутентификация
- **Ролевой доступ**: Разные разрешения для пользователей, админов, модераторов
- **Rate limiting**: Предотвращает злоупотребление API и DoS атаки

#### Защита данных
- **Принудительный HTTPS**: Все коммуникации зашифрованы
- **CSRF защита**: Токены для отправки форм
- **Санитизация входных данных**: Предотвращает инъекцию вредоносных данных

### Архитектура масштабируемости

#### Горизонтальное масштабирование
- **Балансировщик нагрузки**: Распределяет запросы между множественными инстансами приложения
- **Read replicas БД**: Разделяет операции чтения и записи
- **Redis кластеризация**: Распределенное кэширование и хранение сессий
- **CDN интеграция**: Оптимизация доставки статических ресурсов

#### Готовность к микросервисам
- **API-first дизайн**: RESTful endpoints для интеграции сервисов
- **Event-driven архитектура**: Kafka/RabbitMQ для асинхронной коммуникации
- **Service discovery**: Динамическая регистрация и обнаружение сервисов
- **Circuit breakers**: Отказоустойчивость для внешних зависимостей

---

## Quick Start / Быстрый старт

```bash
# Install dependencies / Установка зависимостей
npm install
cd server && npm install && cd ..

# Database setup / Настройка БД
cd server
npx prisma migrate dev
npx prisma db seed

# Development / Разработка
npm run dev          # Frontend
cd server && npm run dev  # Backend
```

## Features / Возможности

- **Interactive Graph Visualization**: Explore community relationships with force-directed layout
- **Real-time Updates**: Live graph updates with WebSocket connections
- **Advanced Search**: Filter communities by type, tags, and relationships
- **Admin Panel**: Comprehensive management interface for community data
- **Review System**: User ratings and feedback for communities
- **Analytics Dashboard**: Insights into community growth and engagement
- **Mobile Responsive**: Optimized experience across all devices
- **Performance Optimized**: Handles large datasets with spatial partitioning
- **Security Focused**: JWT authentication, input validation, rate limiting
- **Scalable Architecture**: Ready for horizontal scaling and microservices

## Contributing / Вклад в проект

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License / Лицензия

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
