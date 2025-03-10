import React, { useState, useEffect } from 'react';
import { Article } from '@/types/article';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { convertToHebrewDateSync } from '@/utils/dateUtils';

interface ArticleCardProps {
  article: Article;
}

const DEFAULT_IMAGE = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/default.jpg';

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [isRead, setIsRead] = useState(false);
  const [hebrewDate, setHebrewDate] = useState('');
  
  // Check if the article has been read (from localStorage)
  useEffect(() => {
    const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
    setIsRead(readArticles.includes(article.id));
  }, [article.id]);
  
  // Format Hebrew date
  useEffect(() => {
    // Get publication date - prioritize article_publications scheduled_date if available
    const publicationDate = article.article_publications && 
      article.article_publications.length > 0 && 
      article.article_publications[0].scheduled_date
        ? article.article_publications[0].scheduled_date
        : article.published_at;
    
    if (publicationDate) {
      const date = new Date(publicationDate);
      // Use synchronous version for component rendering
      const formattedDate = convertToHebrewDateSync(date);
      setHebrewDate(formattedDate);
      
      // Also try to get the async version which might be more accurate
      const fetchHebrewDate = async () => {
        try {
          const { convertToHebrewDate } = await import('@/utils/dateUtils');
          const asyncDate = await convertToHebrewDate(date);
          setHebrewDate(asyncDate);
        } catch (error) {
          console.error('Error fetching async Hebrew date:', error);
        }
      };
      
      fetchHebrewDate();
    }
  }, [article]);
  
  // Mark article as read when clicked
  const markAsRead = () => {
    const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
    if (!readArticles.includes(article.id)) {
      const updatedReadArticles = [...readArticles, article.id];
      localStorage.setItem('readArticles', JSON.stringify(updatedReadArticles));
      setIsRead(true);
    }
  };
  
  // Format the publication date (Gregorian)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  
  // Get publication date - prioritize article_publications scheduled_date if available
  const publicationDate = article.article_publications && 
    article.article_publications.length > 0 && 
    article.article_publications[0].scheduled_date
      ? article.article_publications[0].scheduled_date
      : article.published_at;
  
  return (
    <Link 
      to={`/articles/${article.id}`} 
      onClick={markAsRead}
      className="block bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
        <img 
          src={DEFAULT_IMAGE} 
          alt={article.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {isRead && (
          <div className="absolute top-2 left-2 bg-purple-dark text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Check size={12} className="ml-1" />
            <span>נקרא</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-xl font-alef font-bold text-purple-dark mb-2 line-clamp-2">{article.title}</h2>
        <div className="flex flex-col text-sm text-gray-600">
          <span className="mb-1 text-gold-dark">{hebrewDate}</span>
          <span>{formatDate(publicationDate)}</span>
        </div>
        {article.categories && (
          <div className="mt-3">
            <span className="inline-block bg-purple-light/10 text-purple-dark text-xs px-2 py-1 rounded-full">
              {article.categories.name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ArticleCard;
