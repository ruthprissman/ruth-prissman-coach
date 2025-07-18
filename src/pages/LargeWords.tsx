
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article } from '@/types/article';
import ArticleCard from '@/components/ArticleCard';
import ArticleFilters from '@/components/ArticleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

const LargeWords = () => {
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
      console.log("🔍 [LargeWords] fetchArticles started");
      console.log("🔍 [LargeWords] Input parameters:", { 
        selectedCategory, 
        dateFilter,
        searchQuery,
        contentType
      });
      
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        console.log("🔍 [LargeWords] Current timestamp for filtering:", now);
        
        const todayDateOnly = new Date().toISOString().split('T')[0];
        console.log("🔍 [LargeWords] Today's date for date-only comparison:", todayDateOnly);
        
        console.log("🔍 [LargeWords] Executing Supabase query to fetch professional_content with joined tables");
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
          console.error("❌ [LargeWords] Database query error:", error);
          throw error;
        }

        console.log(`🔍 [LargeWords] Raw database result: ${data?.length} records returned`);
        console.log("🔍 [LargeWords] Sample of first record:", data?.[0] ? JSON.stringify(data[0], null, 2) : "No records");
        
        const articlesData = (data as Article[]).filter(article => {
          if (!article.article_publications || article.article_publications.length === 0) {
            console.log(`🔍 [LargeWords] Article ID ${article.id} skipped: No article_publications`);
            return false;
          }
          
          const hasValidWebsitePublication = article.article_publications.some(pub => {
            const isWebsite = pub.publish_location === 'Website';
            const hasScheduledDate = !!pub.scheduled_date;
            
            const scheduledDateOnly = pub.scheduled_date ? pub.scheduled_date.split('T')[0] : null;
            
            const isScheduledForTodayOrEarlier = scheduledDateOnly && scheduledDateOnly <= todayDateOnly;
            
            if (!isWebsite) {
              console.log(`🔍 [LargeWords] Publication for article ID ${article.id} skipped: Not a Website publication (${pub.publish_location})`);
            } else if (!hasScheduledDate) {
              console.log(`🔍 [LargeWords] Website publication for article ID ${article.id} skipped: No scheduled_date`);
            } else if (!isScheduledForTodayOrEarlier) {
              console.log(`🔍 [LargeWords] Website publication for article ID ${article.id} skipped: scheduled_date (${scheduledDateOnly}) is in the future compared to today (${todayDateOnly})`);
            } else {
              console.log(`🔍 [LargeWords] Website publication for article ID ${article.id} INCLUDED: scheduled_date (${scheduledDateOnly}) is today or earlier`);
            }
            
            return isWebsite && hasScheduledDate && isScheduledForTodayOrEarlier;
          });
          
          if (hasValidWebsitePublication) {
            console.log(`🔍 [LargeWords] Article ID ${article.id} included: Has valid Website publication`);
          }
          
          return hasValidWebsitePublication;
        });
        
        console.log(`🔍 [LargeWords] After Website publication filtering: ${articlesData.length} articles remain`);
        
        setArticles(articlesData);
        setFilteredArticles(articlesData);

        console.log("🔍 [LargeWords] Extracting unique categories from filtered articles");
        const uniqueCategories = Array.from(
          new Map(
            articlesData
              .filter(article => article.category_id !== null && article.categories !== null)
              .map(article => [article.categories!.id, article.categories!])
          ).values()
        );

        console.log(`🔍 [LargeWords] Found ${uniqueCategories.length} unique categories: `, 
          uniqueCategories.map(c => `${c.id}: ${c.name}`).join(', '));
        
        setCategories(uniqueCategories as { id: number; name: string }[]);
        console.log("✅ [LargeWords] fetchArticles completed successfully");
      } catch (error) {
        console.error("❌ [LargeWords] Error in fetchArticles:", error);
      } finally {
        setIsLoading(false);
        console.log("🔍 [LargeWords] Loading state set to false");
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
    console.log("🛠️ [LargeWords] Current date for filtering:", now);
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      console.log("🛠️ [LargeWords] Month ago date for filtering:", monthAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [LargeWords] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [LargeWords] UTC Date object:", utcDate);
        
        const result = utcDate >= monthAgo && utcDate <= now;
        console.log(`🛠️ [LargeWords] Article ${article.id} month filter result:`, result);
        
        return result;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      console.log("🛠️ [LargeWords] Week ago date for filtering:", weekAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [LargeWords] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [LargeWords] UTC Date object:", utcDate);
        
        const result = utcDate >= weekAgo && utcDate <= now;
        console.log(`🛠️ [LargeWords] Article ${article.id} week filter result:`, result);
        
        return result;
      });
    }

    console.log(`🔍 [LargeWords] After applying UI filters: ${filtered.length} articles to display`);
    if (filtered.length > 0) {
      console.log("🔍 [LargeWords] First article to be displayed:", {
        id: filtered[0].id,
        title: filtered[0].title,
        category: filtered[0].categories?.name || 'No category'
      });
    } else {
      console.log("🔍 [LargeWords] No articles found after applying filters");
    }
    
    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory, dateFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>חיבורים קטנים למילים גדולות - רות פריסמן | קוד הנפש</title>
        <meta name="description" content="מבט חדש על מילות התפילה – רגע של חיבור בתוך שגרת היום. חיבורים מעמיקים מאת רות פריסמן לכל אשה במסע הרוחני שלה." />
        <meta name="keywords" content="מילות תפילה, חיבורים רוחניים, רות פריסמן, כתיבה טיפולית, העצמה נשית, רוחניות, קוד הנפש, חיבור רוחני, תפילה, התפתחות רוחנית" />
      </Helmet>
      
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-alef text-center text-[#4A235A] mb-10 gold-text-shadow">
            חיבורים קטנים למילים גדולות
          </h1>
          <p className="text-center text-lg md:text-xl text-[#4A235A] mb-8 max-w-3xl mx-auto font-alef">
            מבט חדש על מילות התפילה – רגע של חיבור בתוך שגרת היום.
          </p>
          
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div className="relative w-full md:w-1/3 flex flex-col">
                <Label htmlFor="search" className="mb-2">חיפוש</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="search"
                    type="text"
                    placeholder="חיפוש חיבורים..."
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
                <ArticleCard key={article.id} article={article} basePath="/large-words" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">לא נמצאו חיבורים התואמים את החיפוש</p>
            </div>
          )}
          
          <div className="mt-20">
            <Card className="w-full max-w-md mx-auto shadow-lg border-2 border-[#D4C5B9]">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-[#4A235A] text-center">
                  הצטרף/י לרשימות התפוצה
                </CardTitle>
                <p className="text-[#4A235A]/80 mt-2 text-center">
                  קבל/י תוכן חדש וחיבורים ישירות למייל
                </p>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-[#4A235A]/70 mb-6">
                  בחר/י את רשימות התפוצה המעניינות אותך והישאר/י מעודכן/ת
                </p>
                
                <Link to="/subscribe">
                  <Button 
                    className="bg-[#D4C5B9] hover:bg-[#C5B3A3] text-[#4A235A] font-semibold px-8 py-3 text-lg w-full"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    להצטרפות לרשימות התפוצה
                  </Button>
                </Link>
                
                <p className="text-xs text-[#4A235A]/60 mt-4 leading-relaxed">
                  אפשרות להירשם לתוכן מקצועי או לסיפורים
                  <br />
                  <Link to="/privacy-policy" className="text-[#4A235A] hover:underline mx-1">
                    מדיניות הפרטיות
                  </Link>
                  |
                  <Link to="/unsubscribe" className="text-[#4A235A] hover:underline mx-1">
                    להסרה מרשימת התפוצה
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
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

export default LargeWords;
