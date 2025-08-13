#!/bin/bash

# Скрипт для загрузки проекта на GitHub
echo "Начинаем загрузку проекта на GitHub..."

# Переходим в директорию проекта
cd "/Users/artemvedernikov/Documents/Сайт сообществ"

# Удаляем старый .git если есть
if [ -d ".git" ]; then
    echo "Удаляем старый Git репозиторий..."
    rm -rf .git
fi

# Инициализируем новый Git репозиторий
echo "Инициализируем новый Git репозиторий..."
git init

# Добавляем все файлы
echo "Добавляем файлы..."
git add .

# Делаем первый коммит
echo "Создаем первый коммит..."
git commit -m "Initial commit"

# Добавляем удаленный репозиторий
echo "Добавляем удаленный репозиторий..."
git remote add origin https://github.com/loolyMQ/Community_site.git

# Принудительно загружаем на GitHub
echo "Загружаем на GitHub..."
git push -u origin main --force

echo "Готово! Проект загружен на GitHub."
