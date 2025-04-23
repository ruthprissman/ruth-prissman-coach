import React, { useState, useEffect } from 'react';
import { Article } from '@/types/article';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { convertToHebrewDateSync } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
  basePath?: string;
}

const ARTICLE_DEFAULT_IMAGE = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/stories_img//content-tree.PNG';
const DEFAULT_IMAGE = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/default.jpg';

const ArticleCard: React.FC<ArticleCardProps> = ({ article, basePath = "/articles" }) => {
  const [isRead, setIsRead] = useState(false);
  const [hebrewDate, setHebrewDate] = useState('');
  
  useEffect(() => {
    const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
    setIsRead(readArticles.includes(article.id));
  }, [article.id]);
  
  useEffect(() => {
    const publicationDate = article.article_publications && 
      article.article_publications.length > 0 && 
      article.article_publications[0].scheduled_date
        ? article.article_publications[0].scheduled_date
        : article.published_at;
    
    console.log(`🛠️ [ArticleCard] Article ID: ${article.id}, Title: ${article.title}`);
    console.log("🛠️ [ArticleCard] Raw publication date from Supabase:", publicationDate);
    
    if (publicationDate) {
      const date = new Date(publicationDate);
      console.log("🛠️ [ArticleCard] Parsed as Date object:", date);
      console.log("🛠️ [ArticleCard] Date toString():", date.toString());
      console.log("🛠️ [ArticleCard] Date toISOString():", date.toISOString());
      console.log("🛠️ [ArticleCard] Date timezone offset (minutes):", date.getTimezoneOffset());
      
      const israelDate = new Date(date.getTime() + (2 * 60 * 60 * 1000));
      console.log("🛠️ [ArticleCard] Adjusted to Israel Time (UTC+2):", israelDate);
      console.log("🛠️ [ArticleCard] Israel Date toString():", israelDate.toString());
      
      const formattedDate = convertToHebrewDateSync(israelDate);
      console.log("🛠️ [ArticleCard] Hebrew date (sync):", formattedDate);
      setHebrewDate(formattedDate);
      
      const fetchHebrewDate = async () => {
        try {
          const { convertToHebrewDate } = await import('@/utils/dateUtils');
          const asyncDate = await convertToHebrewDate(israelDate);
          console.log("🛠️ [ArticleCard] Hebrew date (async):", asyncDate);
          setHebrewDate(asyncDate);
        } catch (error) {
          console.error('Error fetching async Hebrew date:', error);
        }
      };
      
      fetchHebrewDate();
    }
  }, [article]);
  
  const markAsRead = () => {
    const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
    if (!readArticles.includes(article.id)) {
      const updatedReadArticles = [...readArticles, article.id];
      localStorage.setItem('readArticles', JSON.stringify(updatedReadArticles));
      setIsRead(true);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    console.log("🛠️ [ArticleCard] formatDate input:", dateString);
    
    const utcDate = new Date(dateString);
    console.log("🛠️ [ArticleCard] UTC Date object:", utcDate);
    
    const israelDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    console.log("🛠️ [ArticleCard] Adjusted to Israel Time:", israelDate);
    
    const formattedDate = format(israelDate, 'dd/MM/yyyy', { locale: he });
    console.log("🛠️ [ArticleCard] Final formatted date:", formattedDate);
    
    return formattedDate;
  };
  
  const getArticleImage = () => {
    if (article.image_url) return article.image_url;
    if (article.type === 'article') return ARTICLE_DEFAULT_IMAGE;
    return DEFAULT_IMAGE;
  };
  
  const imageUrl = getArticleImage();
  
  const publicationDate = article.article_publications && 
    article.article_publications.length > 0 && 
    article.article_publications[0].scheduled_date
      ? article.article_publications[0].scheduled_date
      : article.published_at;
  
  return (
    <Link 
      to={`${basePath}/${article.id}`}
      onClick={markAsRead}
      className="block bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
        <img 
          src={imageUrl} 
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
