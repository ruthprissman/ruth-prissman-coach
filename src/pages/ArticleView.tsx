import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { convertToHebrewDateSync, formatDateInIsraelTimeZone } from '@/utils/dateUtils';
import { formatInTimeZone } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface SiteLink {
  id: number;
  name: string;
  fixed_text: string;
  url: string | null;
  list_type: string | null;
}

const ArticleView = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [siteLinks, setSiteLinks] = useState<SiteLink[]>([]);
  const [hebrewDate, setHebrewDate] = useState('');
  
  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*),
            article_publications (*)
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setArticle(data as Article);
        
        const publicationDate = getPublicationDate(data as Article);
        if (publicationDate) {
          const date = new Date(publicationDate);
          
          const syncHebrewDate = convertToHebrewDateSync(date);
          setHebrewDate(syncHebrewDate);
          
          try {
            const { convertToHebrewDate } = await import('@/utils/dateUtils');
            const asyncHebrewDate = await convertToHebrewDate(date);
            setHebrewDate(asyncHebrewDate);
          } catch (error) {
            console.error('Error fetching async Hebrew date:', error);
          }
        }
        
        const { data: linksData, error: linksError } = await supabase
          .from('static_links')
          .select('*')
          .or('list_type.eq.site,list_type.eq.all');
          
        if (!linksError && linksData) {
          setSiteLinks(linksData);
        }
        
        const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
        if (!readArticles.includes(Number(id))) {
          localStorage.setItem('readArticles', JSON.stringify([...readArticles, Number(id)]));
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchArticle();
    }
  }, [id]);
  
  const formatUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    url = url.trim();
    
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return `mailto:${url}`;
    }
    
    if (url.includes('whatsapp') || url.startsWith('+') || 
        url.startsWith('972') || url.match(/^\d{10,15}$/)) {
      
      const phoneNumber = url.replace(/\D/g, '');
      
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : `972${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      return `https://wa.me/${formattedNumber}`;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('#')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  const getPublicationDate = (article: Article | null) => {
    if (!article) return null;
    
    const publishDate = article.article_publications && article.article_publications.length > 0
      ? article.article_publications.find(pub => pub.scheduled_date)?.scheduled_date || article.published_at
      : article.published_at;
      
    console.log("🛠️ [ArticleView] Raw publication date:", publishDate);
    return publishDate;
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    console.log("🛠️ [ArticleView] formatDate input:", dateString);
    
    // Parse the UTC date
    const utcDate = new Date(dateString);
    console.log("🛠️ [ArticleView] UTC Date object:", utcDate);
    
    // Adjust to Israel Time (UTC+2)
    const israelDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    console.log("🛠️ [ArticleView] Adjusted to Israel Time:", israelDate);
    
    // Format the date
    const formattedDate = format(israelDate, 'dd MMMM yyyy', { locale: he });
    console.log("🛠️ [ArticleView] Final formatted date:", formattedDate);
    
    return formattedDate;
  };
  
  const createMarkup = (content: string | null) => {
    if (!content) return { __html: '' };
    
    const htmlContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return { __html: `<p>${htmlContent}</p>` };
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link to="/articles">
              <Button variant="ghost" className="text-purple-dark hover:text-purple-darkest">
                <ChevronRight className="ml-1" size={16} />
                חזרה למאמרים
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton className="w-full h-14 mb-4" />
              <Skeleton className="w-1/3 h-8 mb-10" />
              <Skeleton className="w-full h-64" />
            </div>
          ) : article ? (
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-darkest mb-4">
                {article.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mb-8 space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                <div className="flex items-center">
                  <Calendar size={16} className="ml-2 text-gold" />
                  <span className="text-gold-dark">{hebrewDate}</span>
                </div>
                <span className="hidden sm:block text-gray-400">|</span>
                <span>{formatDate(getPublicationDate(article))}</span>
                
                {article.categories && (
                  <>
                    <span className="hidden sm:block text-gray-400">|</span>
                    <span className="inline-block bg-purple-light/10 text-purple-dark px-2 py-1 rounded-full text-xs">
                      {article.categories.name}
                    </span>
                  </>
                )}
              </div>
              
              <div className="prose prose-lg max-w-none">
                <div 
                  dangerouslySetInnerHTML={createMarkup(article.content_markdown)} 
                  className="text-gray-800 leading-relaxed"
                />
              </div>
              
              {article.contact_email && (
                <div className="mt-8 p-4 bg-purple-light/5 rounded-lg border border-purple-light/20">
                  <a href={`mailto:${article.contact_email}`} className="write-to-me flex items-center">
                    <MessageSquare size={18} className="ml-2" />
                    כתבי ��י: {article.contact_email}
                  </a>
                </div>
              )}
              
              {siteLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-alef font-bold text-purple-dark mb-3">קישורים נוספים</h3>
                  <ul className="space-y-2">
                    {siteLinks.map(link => {
                      const url = formatUrl(link.url);
                      if (url && link.fixed_text) {
                        return (
                          <li key={link.id} className="golden-bullet">
                            <a 
                              href={url} 
                              className="text-purple-dark hover:text-gold transition-colors"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {link.fixed_text}
                            </a>
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">המאמר לא נמצא</p>
              <Link to="/articles">
                <Button variant="outline" className="mt-4">
                  חזרה למאמרים
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <style>
        {`
        .write-to-me {
          color: #4A235A !important;
          font-weight: bold !important;
          transition: color 0.3s ease;
        }
        
        .write-to-me:hover {
          color: #7E69AB !important;
        }
        
        .golden-bullet::before {
          content: "•";
          color: var(--gold);
          margin-right: 0.5rem;
        }
        `}
      </style>
    </div>
  );
};

export default ArticleView;
