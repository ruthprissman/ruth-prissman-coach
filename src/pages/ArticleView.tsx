
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { convertToHebrewDate } from '@/utils/dateUtils';

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
        
        // Fetch site links
        const { data: linksData, error: linksError } = await supabase
          .from('static_links')
          .select('*')
          .or('list_type.eq.site,list_type.eq.all');
          
        if (!linksError && linksData) {
          setSiteLinks(linksData);
        }
        
        // Mark as read in localStorage
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
  
  // Format URL for links
  const formatUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    url = url.trim();
    
    // Check if it's an email address
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return `mailto:${url}`;
    }
    
    // Check if it's a WhatsApp number
    if (url.includes('whatsapp') || url.startsWith('+') || 
        url.startsWith('972') || url.match(/^\d{10,15}$/)) {
      
      // Extract only numbers
      const phoneNumber = url.replace(/\D/g, '');
      
      // Make sure it starts with country code
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : `972${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      return `https://wa.me/${formattedNumber}`;
    }
    
    // Add https:// if missing for regular URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('#')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  // Get the most recent publication date
  const getPublicationDate = () => {
    if (!article) return null;
    
    if (article.article_publications && article.article_publications.length > 0) {
      return article.article_publications.find(pub => pub.published_date)?.published_date || article.published_at;
    }
    
    return article.published_at;
  };
  
  // Format the publication date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  
  // Get Hebrew date
  const publicationDate = getPublicationDate();
  const hebrewDate = publicationDate 
    ? convertToHebrewDate(new Date(publicationDate))
    : '';
  
  // Convert markdown to HTML
  const createMarkup = (content: string | null) => {
    if (!content) return { __html: '' };
    
    // Basic markdown conversion
    const htmlContent = content
      .replace(/\n\n/g, '</p><p>') // Convert paragraphs
      .replace(/\n/g, '<br />') // Convert line breaks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
    
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
                <span>{formatDate(publicationDate)}</span>
                
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
                {/* Render the markdown content as HTML */}
                <div 
                  dangerouslySetInnerHTML={createMarkup(article.content_markdown)} 
                  className="text-gray-800 leading-relaxed"
                />
              </div>
              
              {/* Contact info */}
              {article.contact_email && (
                <div className="mt-8 p-4 bg-purple-light/5 rounded-lg border border-purple-light/20">
                  <a href={`mailto:${article.contact_email}`} className="write-to-me flex items-center">
                    <MessageSquare size={18} className="ml-2" />
                    כתבי לי: {article.contact_email}
                  </a>
                </div>
              )}
              
              {/* Site links */}
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
      
      {/* Add custom styles */}
      <style>
        {`
        .write-to-me {
          color: #4A235A !important;
          font-weight: bold !important;
        }
        `}
      </style>
    </div>
  );
};

export default ArticleView;
