-- Исправляем поле phone в продакшн базе данных
UPDATE communities 
SET phone = '{}'::text[] 
WHERE phone IS NULL OR phone = '[]'::text[];

-- Исправляем поле telegram в продакшн базе данных
UPDATE communities 
SET telegram = '{}'::text[] 
WHERE telegram IS NULL OR telegram = '[]'::text[];

-- Исправляем поле vk в продакшн базе данных
UPDATE communities 
SET vk = '{}'::text[] 
WHERE vk IS NULL OR vk = '[]'::text[];

-- Исправляем поле website в продакшн базе данных
UPDATE communities 
SET website = '{}'::text[] 
WHERE website IS NULL OR website = '[]'::text[];

-- Проверяем результат
SELECT id, name, phone, telegram, vk, website FROM communities;
