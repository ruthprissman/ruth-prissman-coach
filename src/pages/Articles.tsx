
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article } from '@/types/article';
import ArticleCard from '@/components/ArticleCard';
import ArticleFilters from '@/components/ArticleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Helmet } from 'react-helmet-async';

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [contentType, setContentType] = useState<string>('article');

  useEffect(() => {
    const fetchArticles = async () => {
      console.log("🔍 [Articles] fetchArticles started");
      console.log("🔍 [Articles] Input parameters:", { 
        selectedCategory, 
        dateFilter,
        searchQuery,
        contentType
      });
      
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        console.log("🔍 [Articles] Current timestamp for filtering:", now);
        
        const todayDateOnly = new Date().toISOString().split('T')[0];
        console.log("🔍 [Articles] Today's date for date-only comparison:", todayDateOnly);
        
        console.log("🔍 [Articles] Executing Supabase query to fetch professional_content with joined tables");
        const supabase = await supabaseClient();
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*),
            article_publications (*)
          `)
          .not('published_at', 'is', null)
          .eq('type', contentType)
          .order('published_at', { ascending: false });

        if (error) {
          console.error("❌ [Articles] Database query error:", error);
          throw error;
        }

        console.log(`🔍 [Articles] Raw database result: ${data?.length} records returned`);
        console.log("🔍 [Articles] Sample of first record:", data?.[0] ? JSON.stringify(data[0], null, 2) : "No records");
        
        const articlesData = (data as Article[]).filter(article => {
          if (!article.article_publications || article.article_publications.length === 0) {
            console.log(`🔍 [Articles] Article ID ${article.id} skipped: No article_publications`);
            return false;
          }
          
          const hasValidWebsitePublication = article.article_publications.some(pub => {
            const isWebsite = pub.publish_location === 'Website';
            const isPublished = !!pub.published_date; // Check if publication was actually published
            
            if (!isWebsite) {
              console.log(`🔍 [Articles] Publication for article ID ${article.id} skipped: Not a Website publication (${pub.publish_location})`);
              return false;
            }
            
            if (!isPublished) {
              console.log(`🔍 [Articles] Website publication for article ID ${article.id} skipped: Not published yet (published_date is null)`);
              return false;
            }
            
            // For publications that were scheduled, check if they should be visible
            if (pub.scheduled_date) {
              const scheduledDateOnly = pub.scheduled_date.split('T')[0];
              const isScheduledForTodayOrEarlier = scheduledDateOnly <= todayDateOnly;
              
              if (!isScheduledForTodayOrEarlier) {
                console.log(`🔍 [Articles] Website publication for article ID ${article.id} skipped: scheduled_date (${scheduledDateOnly}) is in the future compared to today (${todayDateOnly})`);
                return false;
              } else {
                console.log(`🔍 [Articles] Website publication for article ID ${article.id} INCLUDED: scheduled_date (${scheduledDateOnly}) is today or earlier`);
              }
            } else {
              // For immediate publications (no scheduled_date), they're always visible if published
              console.log(`🔍 [Articles] Website publication for article ID ${article.id} INCLUDED: Immediate publication (no scheduled_date)`);
            }
            
            return true;
          });
          
          if (hasValidWebsitePublication) {
            console.log(`🔍 [Articles] Article ID ${article.id} included: Has valid Website publication`);
          }
          
          return hasValidWebsitePublication;
        });
        
        console.log(`🔍 [Articles] After Website publication filtering: ${articlesData.length} articles remain`);
        
        setArticles(articlesData);
        setFilteredArticles(articlesData);

        console.log("🔍 [Articles] Extracting unique categories from filtered articles");
        const uniqueCategories = Array.from(
          new Map(
            articlesData
              .filter(article => article.category_id !== null && article.categories !== null)
              .map(article => [article.categories!.id, article.categories!])
          ).values()
        );

        console.log(`🔍 [Articles] Found ${uniqueCategories.length} unique categories: `, 
          uniqueCategories.map(c => `${c.id}: ${c.name}`).join(', '));
        
        setCategories(uniqueCategories as { id: number; name: string }[]);
        console.log("✅ [Articles] fetchArticles completed successfully");
      } catch (error) {
        console.error("❌ [Articles] Error in fetchArticles:", error);
      } finally {
        setIsLoading(false);
        console.log("🔍 [Articles] Loading state set to false");
      }
    };

    fetchArticles();
  }, [contentType]);

  useEffect(() => {
    let filtered = [...articles];

    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(lowercaseQuery)
      );
    }

    if (selectedCategory !== null) {
      filtered = filtered.filter(article => article.category_id === selectedCategory);
    }

    const now = new Date();
    console.log("🛠️ [Articles] Current date for filtering:", now);
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      console.log("🛠️ [Articles] Month ago date for filtering:", monthAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [Articles] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [Articles] UTC Date object:", utcDate);
        
        const result = utcDate >= monthAgo && utcDate <= now;
        console.log(`🛠️ [Articles] Article ${article.id} month filter result:`, result);
        
        return result;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      console.log("🛠️ [Articles] Week ago date for filtering:", weekAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [Articles] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [Articles] UTC Date object:", utcDate);
        
        const result = utcDate >= weekAgo && utcDate <= now;
        console.log(`🛠️ [Articles] Article ${article.id} week filter result:`, result);
        
        return result;
      });
    }

    console.log(`🔍 [Articles] After applying UI filters: ${filtered.length} articles to display`);
    if (filtered.length > 0) {
      console.log("🔍 [Articles] First article to be displayed:", {
        id: filtered[0].id,
        title: filtered[0].title,
        category: filtered[0].categories?.name || 'No category'
      });
    } else {
      console.log("🔍 [Articles] No articles found after applying filters");
    }
    
    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory, dateFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>מאמרים מקצועיים - רות פריסמן | קוד הנפש</title>
        <meta name="description" content="מאמרים קצרים ומעוררי השראה על רגעים מהחיים, מתוך מבט רוחני ואנושי. מתעדכן בכל שבוע מחדש." />
        <meta name="keywords" content="מאמרים רגשיים, אימון רגשי, רות פריסמן, כתיבה טיפולית, העצמה נשית, קואצ'ינג, קוד הנפש, רגש, התפתחות, תהליך אישי, גישת קוד הנפש" />
        <link rel="canonical" href="https://coach.ruthprissman.co.il/articles" />
        <meta name="robots" content="index,follow" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="מילים גדולות – מאמרים שבועיים מאת רות פריסמן" />
        <meta property="og:description" content="מאמרים מעוררי השראה על החיים, מתוך תבונה נשית, רוחנית ורגשית." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://coach.ruthprissman.co.il/articles" />
        <meta property="og:image" content="https://coach.ruthprissman.co.il/images/og-articles.jpg" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="מילים גדולות – מאמרים שבועיים מאת רות פריסמן" />
        <meta name="twitter:description" content="מאמרים מעוררי השראה על החיים, מתוך תבונה נשית, רוחנית ורגשית." />
        <meta name="twitter:image" content="https://coach.ruthprissman.co.il/images/og-articles.jpg" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "מילים גדולות",
            "description": "מאמרים שבועיים מאת רות פריסמן – על חיבורים אנושיים, נשיים ורוחניים.",
            "url": "https://coach.ruthprissman.co.il/articles",
            "hasPart": [
              {
                "@type": "Article",
                "headline": "בין המילים: נטילת ידיים",
                "author": "רות פריסמן",
                "datePublished": "2025-07-20"
              },
              {
                "@type": "Article",
                "headline": "בין המילים: תשעת הימים",
                "author": "רות פריסמן",
                "datePublished": "2025-07-26"
              },
              {
                "@type": "Article",
                "headline": "מילים לזמנים מיוחדים: תשעה באב",
                "author": "רות פריסמן",
                "datePublished": "2025-07-31"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-purple-darkest mb-8 text-center">מאמרים</h1>
          
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div className="relative w-full md:w-1/3 flex flex-col">
                <Label htmlFor="search" className="mb-2">חיפוש</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="search"
                    type="text"
                    placeholder="חיפוש מאמרים..."
                    className="pr-10 text-right h-10 filter-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir="rtl"
                  />
                </div>
              </div>
              
              <ArticleFilters 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                contentType={contentType}
                onContentTypeChange={setContentType}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex flex-col">
                  <Skeleton className="w-full h-48 rounded-t-lg" />
                  <Skeleton className="w-3/4 h-8 mt-4" />
                  <Skeleton className="w-1/2 h-6 mt-2" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">לא נמצאו מאמרים התואמים את החיפוש</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <style>
        {`
        .filter-input {
          height: 40px !important;
          text-align: right !important;
        }

        .write-to-me {
          color: #4A235A !important;
          font-weight: bold !important;
          transition: color 0.3s ease;
        }
        
        .write-to-me:hover {
          color: #7E69AB !important;
        }
        `}
      </style>
    </div>
  );
};

export default Articles;
