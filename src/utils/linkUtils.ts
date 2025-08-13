export interface ParsedLink {
  type: 'telegram' | 'vk' | 'email' | 'phone' | 'website' | 'other';
  url: string;
  displayName: string;
}

export interface ParsedLinks {
  telegram?: string;
  vk?: string;
  email?: string;
  phone?: string;
  website?: string;
  other?: string[];
}

/**
 * Определяет тип ссылки и возвращает структурированную информацию
 */
export function parseLink(url: string): ParsedLink {
  const cleanUrl = url.trim().toLowerCase();
  
  // Telegram (должен быть первым, чтобы @username не интерпретировался как email)
  if (cleanUrl.includes('t.me/') || cleanUrl.includes('telegram.me/') || url.startsWith('@')) {
    let telegramUrl = url.trim();
    if (telegramUrl.startsWith('@')) {
      telegramUrl = `https://t.me/${telegramUrl.substring(1)}`;
    } else if (!telegramUrl.startsWith('http')) {
      telegramUrl = `https://${telegramUrl}`;
    }
    return {
      type: 'telegram',
      url: telegramUrl,
      displayName: 'Telegram'
    };
  }
  
  // VK
  else if (cleanUrl.includes('vk.com/') || cleanUrl.includes('vk.ru/')) {
    let vkUrl = url.trim();
    if (!vkUrl.startsWith('http')) {
      vkUrl = `https://${vkUrl}`;
    }
    return {
      type: 'vk',
      url: vkUrl,
      displayName: 'VK'
    };
  }
  
  // Email (только если это действительно email, а не @username)
  else if (cleanUrl.includes('@') && cleanUrl.includes('.') && !url.startsWith('@')) {
    return {
      type: 'email',
      url: `mailto:${url.trim()}`,
      displayName: 'Email'
    };
  }
  
  // Phone
  else if (/^\+?[\d\s\-\(\)]+$/.test(cleanUrl)) {
    return {
      type: 'phone',
      url: `tel:${url.trim()}`,
      displayName: 'Телефон'
    };
  }
  
  // Website (только если это не Telegram, VK или Email)
  else if (cleanUrl.startsWith('http') || cleanUrl.includes('.') && !cleanUrl.includes('@')) {
    let websiteUrl = url.trim();
    if (!websiteUrl.startsWith('http')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    return {
      type: 'website',
      url: websiteUrl,
      displayName: 'Сайт'
    };
  }
  
  // Other
  return {
    type: 'other',
    url: url.trim(),
    displayName: 'Ссылка'
  };
}

/**
 * Парсит строку с множественными ссылками (разделенными запятыми, пробелами или переносами строк)
 */
export function parseMultipleLinks(linksString: string): ParsedLinks {
  if (!linksString || !linksString.trim()) {
    return {};
  }
  
  // Разделяем ссылки по запятым, пробелам и переносам строк
  const links = linksString
    .split(/[,\s\n]+/)
    .map(link => link.trim())
    .filter(link => link.length > 0);
  
  console.log('Parsing links:', links);
  
  const result: ParsedLinks = {
    other: []
  };
  
  links.forEach((link, index) => {
    console.log(`Processing link ${index + 1}:`, link);
    const parsed = parseLink(link);
    console.log(`Parsed link ${index + 1}:`, parsed);
    
    switch (parsed.type) {
      case 'telegram':
        result.telegram = parsed.url;
        break;
      case 'vk':
        result.vk = parsed.url;
        break;
      case 'email':
        result.email = parsed.url;
        break;
      case 'phone':
        result.phone = parsed.url;
        break;
      case 'website':
        result.website = parsed.url;
        break;
      case 'other':
        if (result.other) {
          result.other.push(parsed.url);
        }
        break;
    }
  });
  
  // Удаляем пустой массив other если он пустой
  if (result.other && result.other.length === 0) {
    delete result.other;
  }
  
  console.log('Final parsed result:', result);
  return result;
}

/**
 * Форматирует ссылку для отображения
 */
export function formatLinkForDisplay(url: string): string {
  const parsed = parseLink(url);
  return parsed.displayName;
}

/**
 * Получает первую ссылку определенного типа из множественных ссылок
 */
export function getFirstLinkByType(linksString: string, type: 'telegram' | 'vk' | 'email' | 'phone' | 'website'): string | undefined {
  const parsed = parseMultipleLinks(linksString);
  return parsed[type];
}
