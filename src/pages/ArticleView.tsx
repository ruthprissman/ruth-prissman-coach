import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Article } from '@/types/article';
import { SiteLink } from '@/types/links';
import { supabaseClient } from '@/lib/supabaseClient';
import { ChevronRight, Calendar, MessageSquare, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { convertToHebrewDateSync, formatDateInIsraelTimeZone } from '@/utils/dateUtils';
import { formatInTimeZone } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import MarkdownPreview from '@/components/admin/articles/MarkdownPreview';
import { processMarkdownContent } from '@/utils/contentFormatter';

const ARTICLE_DEFAULT_IMAGE = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/stories_img//content-tree.PNG';

const ArticleView = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [siteLinks, setSiteLinks] = useState<SiteLink[]>([]);
  const [hebrewDate, setHebrewDate] = useState('');
  
  // Determine the back link based on the current URL path
  const getBackLink = () => {
    const currentPath = location.pathname;
    if (currentPath.includes('/large-words/')) {
      return '/large-words';
    }
    // Default to articles if not coming from large-words
    return '/articles';
  };
  
  const getBackButtonText = () => {
    const backLink = getBackLink();
    return backLink === '/large-words' ? 'חזרה למילים גדולות' : 'חזרה למאמרים';
  };

  const handlePrint = () => {
    window.print();
  };
  
  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const supabase = supabaseClient();
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
          const israelDate = new Date(date.getTime() + (2 * 60 * 60 * 1000));
          
          const syncHebrewDate = convertToHebrewDateSync(israelDate);
          setHebrewDate(syncHebrewDate);
          
          try {
            const { convertToHebrewDate } = await import('@/utils/dateUtils');
            const asyncHebrewDate = await convertToHebrewDate(israelDate);
            setHebrewDate(asyncHebrewDate);
          } catch (error) {
            console.error('Error fetching async Hebrew date:', error);
          }
        }
        
        const { data: linksData, error: linksError } = await supabase
          .from('static_links')
          .select('*')
          .or('list_type.eq.site,list_type.eq.all');
          
        if (linksError) {
          console.error('Error fetching site links:', linksError);
        } else if (linksData) {
          console.log("🔍 Fetched links from `static_links`:", linksData);
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
    
    const utcDate = new Date(dateString);
    console.log("🛠️ [ArticleView] UTC Date object:", utcDate);
    
    const israelDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    console.log("🛠️ [ArticleView] Adjusted to Israel Time:", israelDate);
    
    const formattedDate = format(israelDate, 'dd MMMM yyyy', { locale: he });
    console.log("🛠️ [ArticleView] Final formatted date:", formattedDate);
    
    return formattedDate;
  };
  
  const createMarkup = (content: string | null) => {
    if (!content) return { __html: '' };
    
    if (content.startsWith('<')) {
      return { __html: content };
    }
    
    const htmlContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return { __html: `<p>${htmlContent}</p>` };
  };
  
  const getArticleImage = (article: Article | null) => {
    if (article?.image_url) return article.image_url;
    
    if (article?.type === 'article') return ARTICLE_DEFAULT_IMAGE;
    
    return null;
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex justify-between items-center print:hidden">
            <Link to={getBackLink()}>
              <Button variant="ghost" className="text-purple-dark hover:text-purple-darkest">
                <ChevronRight className="ml-1" size={16} />
                {getBackButtonText()}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="flex items-center gap-2 text-purple-dark border-purple-light hover:bg-purple-light/10"
            >
              <Printer size={16} />
              הדפס / ייצוא לPDF
            </Button>
          </div>
          
          {isLoading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton className="w-full h-14 mb-4" />
              <Skeleton className="w-1/3 h-8 mb-10" />
              <Skeleton className="w-full h-64" />
            </div>
          ) : article ? (
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 animate-fade-in">
              {getArticleImage(article) && (
                <div className="mb-8 w-full aspect-[16/9] overflow-hidden rounded-lg">
                  <img 
                    src={getArticleImage(article)} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-darkest mb-4 text-center">
                {article.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mb-8 space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse justify-center">
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
                {article.content_markdown?.startsWith('<') ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: processMarkdownContent(article.content_markdown) }} 
                    className="text-gray-800 leading-relaxed article-html-content"
                  />
                ) : (
                  <MarkdownPreview
                    markdown={processMarkdownContent(article.content_markdown || '')}
                    className="text-gray-800 leading-relaxed text-center"
                  />
                )}
              </div>
              
              {article.contact_email && (
                <div className="mt-8 p-4 bg-purple-light/5 rounded-lg border border-purple-light/20 text-center">
                  <a href={`mailto:${article.contact_email}`} className="write-to-me flex items-center justify-center">
                    <MessageSquare size={18} className="ml-2" />
                    כתבי לי: {article.contact_email}
                  </a>
                </div>
              )}
              
              {siteLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="article-links">
                    {siteLinks.map(link => {
                      const url = formatUrl(link.url);
                      if (link.fixed_text) {
                        return (
                          <div key={link.id} className="link-item mb-4">
                            {url ? (
                              <a 
                                href={url} 
                                className="styled-link font-alef font-bold text-purple-dark hover:text-gold transition-colors block"
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {link.fixed_text}
                              </a>
                            ) : (
                              <span className="non-clickable font-alef font-bold text-gray-800 block">
                                {link.fixed_text}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">המאמר לא נמצא</p>
              <Link to={getBackLink()}>
                <Button variant="outline" className="mt-4">
                  {getBackButtonText()}
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
        
        .styled-link {
          word-break: break-word;
          color: #4A148C;
        }
        
        .article-links {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        .link-item {
          position: relative;
          max-width: 50%;
          word-wrap: break-word;
          overflow-wrap: break-word;
          text-align: center;
        }
        
        .link-item::before {
          content: "•";
          color: var(--gold);
          position: absolute;
          right: -1rem;
          top: 0;
        }
        
        .article-html-content p {
          margin-bottom: 1rem;
          white-space: normal;
          text-align: center;
          min-height: 1.5rem;
        }
        
        .article-html-content p:empty {
          height: 1.5rem;
          border-top: 1px solid transparent;
        }
        
        .article-html-content a {
          color: #4A148C;
          text-decoration: none;
          font-weight: bold;
          transition: color 0.3s ease;
        }
        
        .article-html-content a:hover {
          color: #7E69AB;
        }

        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          
          .container, .container * {
            visibility: visible;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .max-w-3xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          h1 {
            font-size: 24pt !important;
            margin-bottom: 12pt !important;
            page-break-after: avoid;
          }
          
          .prose {
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
          }
          
          .article-links {
            page-break-inside: avoid;
          }
          
          a {
            color: #000 !important;
            text-decoration: underline !important;
          }
          
          .bg-purple-light\\/5 {
            background: #f9f9f9 !important;
            border: 1px solid #ddd !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default ArticleView;
