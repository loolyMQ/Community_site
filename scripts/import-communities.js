const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Helper function to clean text
function cleanText(text) {
  if (!text) return '';
  return text.trim().replace(/^["']|["']$/g, ''); // Remove quotes
}

// Helper function to extract contact info
function extractContactInfo(contactText) {
  if (!contactText) return { telegram: null, vk: null, email: null, phone: null };
  
  const contacts = {
    telegram: null,
    vk: null,
    email: null,
    phone: null
  };

  // Extract Telegram
  const telegramMatch = contactText.match(/@[\w_]+/g);
  if (telegramMatch) {
    contacts.telegram = telegramMatch[0];
  }

  // Extract VK
  const vkMatch = contactText.match(/vk\.com\/[\w_]+/g);
  if (vkMatch) {
    contacts.vk = vkMatch[0];
  }

  // Extract email
  const emailMatch = contactText.match(/[\w.-]+@[\w.-]+\.\w+/g);
  if (emailMatch) {
    contacts.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = contactText.match(/\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}/g);
  if (phoneMatch) {
    contacts.phone = phoneMatch[0];
  }

  return contacts;
}

// Helper function to extract website/social links
function extractWebsite(linkText) {
  if (!linkText) return null;
  
  const links = [];
  
  // Extract various link formats
  const urlMatches = linkText.match(/https?:\/\/[^\s,]+/g);
  if (urlMatches) {
    links.push(...urlMatches);
  }
  
  const telegramMatches = linkText.match(/t\.me\/[^\s,]+/g);
  if (telegramMatches) {
    links.push(...telegramMatches.map(match => `https://${match}`));
  }
  
  const vkMatches = linkText.match(/vk\.com\/[^\s,]+/g);
  if (vkMatches) {
    links.push(...vkMatches.map(match => `https://${match}`));
  }
  
  return links.length > 0 ? links[0] : null; // Return first link
}

// Helper function to normalize category name
function normalizeCategory(categoryName) {
  if (!categoryName) return 'Другое';
  
  const normalized = cleanText(categoryName).toLowerCase();
  
  const categoryMap = {
    'досуг': 'Досуг',
    'искусство': 'Искусство',
    'карьера': 'Карьера',
    'медиа': 'Медиа',
    'наука': 'Наука',
    'общественная деятельность': 'Общественная деятельность',
    'осо': 'ОСО',
    'спорт': 'Спорт',
    '(только) секция': 'Спорт',
    'искусство ': 'Искусство'
  };
  
  return categoryMap[normalized] || 'Другое';
}

async function importCommunities() {
  try {
    console.log('Starting communities import...');
    
    const communities = [];
    const categories = new Set();
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream('./communities_data.csv')
        .pipe(csv())
        .on('data', (row) => {
          const category = normalizeCategory(row['Категория']);
          const name = cleanText(row['Название сообщества']);
          const description = cleanText(row['Описание']);
          const contactInfo = extractContactInfo(row['Контакты руководителя']);
          const website = extractWebsite(row['Ссылка на соцсети ']);
          const comment = cleanText(row['Комментарий ']);
          
          if (name && name !== 'Название сообщества') {
            categories.add(category);
            communities.push({
              category,
              name,
              description: description || 'Описание отсутствует',
              contactInfo,
              website,
              comment
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Found ${communities.length} communities and ${categories.size} categories`);
    
    // Create categories first
    const categoryMap = new Map();
    for (const categoryName of categories) {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          description: `Категория для сообществ: ${categoryName}`,
          icon: '🏷️',
          color: '#3B82F6',
          sortOrder: 0
        }
      });
      categoryMap.set(categoryName, category.id);
    }
    
    console.log('Categories created/updated');
    
    // Create a default admin user if not exists
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@mephi.ru',
          password: '$2b$10$dummy.hash.for.admin.user', // This should be properly hashed
          name: 'Администратор системы',
          role: 'ADMIN',
          isVerified: true
        }
      });
      console.log('Created default admin user');
    }
    
    // Import communities
    let importedCount = 0;
    for (const communityData of communities) {
      try {
        // Create community
        const community = await prisma.community.create({
          data: {
            name: communityData.name,
            description: communityData.description,
            shortDescription: communityData.description.length > 100 
              ? communityData.description.substring(0, 100) + '...' 
              : communityData.description,
            isOfficial: true,
            isActive: true,
            isVerified: true,
            currentMembers: Math.floor(Math.random() * 50) + 5, // Random member count
            maxMembers: Math.floor(Math.random() * 200) + 50,
            leaderId: adminUser.id,
            telegram: communityData.contactInfo.telegram,
            vk: communityData.contactInfo.vk,
            email: communityData.contactInfo.email,
            phone: communityData.contactInfo.phone,
            website: communityData.website,
            location: 'МИФИ',
            meetingSchedule: 'Уточняется',
            requirements: 'Открыто для всех студентов МИФИ',
            achievements: communityData.comment || 'Активное развитие'
          }
        });
        
        // Link community to category
        const categoryId = categoryMap.get(communityData.category);
        if (categoryId) {
          await prisma.communityCategory.create({
            data: {
              communityId: community.id,
              categoryId: categoryId
            }
          });
        }
        
        importedCount++;
        if (importedCount % 10 === 0) {
          console.log(`Imported ${importedCount} communities...`);
        }
        
      } catch (error) {
        console.error(`Error importing community "${communityData.name}":`, error.message);
      }
    }
    
    console.log(`Successfully imported ${importedCount} communities`);
    
    // Create some relationships between communities (based on comments)
    console.log('Creating community relationships...');
    let relationshipCount = 0;
    
    for (const communityData of communities) {
      if (communityData.comment && communityData.comment.includes('связь')) {
        const relatedCategories = communityData.comment
          .match(/связь\s+([а-яё\s]+)/gi)
          ?.map(match => match.replace('связь', '').trim())
          .filter(cat => cat && cat !== 'осо');
        
        if (relatedCategories && relatedCategories.length > 0) {
          const currentCommunity = await prisma.community.findFirst({
            where: { name: communityData.name }
          });
          
          if (currentCommunity) {
            for (const relatedCategory of relatedCategories) {
              const relatedCommunities = await prisma.community.findMany({
                where: {
                  categories: {
                    some: {
                      category: {
                        name: {
                          contains: relatedCategory,
                          mode: 'insensitive'
                        }
                      }
                    }
                  }
                },
                take: 3 // Limit to 3 relationships per community
              });
              
              for (const relatedCommunity of relatedCommunities) {
                if (relatedCommunity.id !== currentCommunity.id) {
                  try {
                    await prisma.communityRelationship.create({
                      data: {
                        sourceCommunityId: currentCommunity.id,
                        targetCommunityId: relatedCommunity.id,
                        relationshipType: 'COLLABORATION',
                        description: `Связь между сообществами`,
                        weight: 0.8
                      }
                    });
                    relationshipCount++;
                  } catch (error) {
                    // Relationship might already exist
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`Created ${relationshipCount} community relationships`);
    
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCommunities(); 