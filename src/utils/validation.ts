// Утилиты для валидации данных

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Валидация email
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email обязателен');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Неверный формат email');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация пароля
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Пароль обязателен');
  } else {
    if (password.length < 8) {
      errors.push('Пароль должен содержать минимум 8 символов');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну заглавную букву');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну строчную букву');
    }
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну цифру');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация имени
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Имя обязательно');
  } else {
    if (name.length < 2) {
      errors.push('Имя должно содержать минимум 2 символа');
    }
    if (name.length > 50) {
      errors.push('Имя не должно превышать 50 символов');
    }
    if (!/^[а-яёa-z\s-]+$/i.test(name)) {
      errors.push('Имя может содержать только буквы, пробелы и дефисы');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация рейтинга отзыва
export const validateReviewRating = (rating: number): ValidationResult => {
  const errors: string[] = [];
  
  if (typeof rating !== 'number') {
    errors.push('Рейтинг должен быть числом');
  } else {
    if (rating < 1 || rating > 5) {
      errors.push('Рейтинг должен быть от 1 до 5');
    }
    if (!Number.isInteger(rating)) {
      errors.push('Рейтинг должен быть целым числом');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация содержания отзыва
export const validateReviewContent = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!content) {
    errors.push('Содержание отзыва обязательно');
  } else {
    if (content.length < 10) {
      errors.push('Содержание отзыва должно содержать минимум 10 символов');
    }
    if (content.length > 2000) {
      errors.push('Содержание отзыва не должно превышать 2000 символов');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Комбинированная валидация
export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): ValidationResult => {
  const errors: string[] = [];
  
  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 