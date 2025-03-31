
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import MarkdownPreview from '@/components/admin/articles/MarkdownPreview';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const PoemView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [poem, setPoemData] = useState<{
    title: string;
    content_markdown: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoem = async () => {
      try {
        setLoading(true);
        const supabase = supabaseClient();
        const today = new Date().toISOString();

        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            id,
            title,
            content_markdown,
            article_publications (*)
          `)
          .eq('id', id)
          .eq('type', 'poem')
          .single();

        if (error) throw error;

        // Check if there's a valid publication for this poem
        const hasValidPublication = data?.article_publications?.some(
          (pub) => 
            pub.publish_location === 'Website' && 
            pub.published_date && 
            new Date(pub.published_date) <= new Date()
        );

        if (!data || !hasValidPublication) {
          throw new Error('שיר לא נמצא או לא פורסם עדיין');
        }

        setPoemData({
          title: data.title,
          content_markdown: data.content_markdown
        });
      } catch (err: any) {
        console.error('Error fetching poem:', err);
        setError(err.message || 'שגיאה בטעינת השיר');
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את השיר המבוקש",
          variant: "destructive",
        });
        // Redirect to poems list after short delay on error
        setTimeout(() => navigate('/poems'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPoem();
    }
  }, [id, navigate, toast]);

  return (
    <>
      <Helmet>
        <title>{poem?.title || 'שיר'} | רות פריסמן - קוד הנפש</title>
        <meta name="description" content={`שיר מאת רות פריסמן - ${poem?.title || ''}`} />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-purple-dark">טוען את השיר...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : poem ? (
            <div className="mb-16">
              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-dark text-center mb-12 gold-text-shadow">
                {poem.title}
              </h1>
              
              <div className="poem-container max-w-4xl mx-auto">
                <div className="poem-content">
                  <MarkdownPreview 
                    markdown={poem.content_markdown} 
                    className="poem-text" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">השיר לא נמצא</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>

      {/* Add CSS for three-column poem layout */}
      <style>{`
        .poem-container {
          padding: 0 1rem;
        }
        
        .poem-content {
          column-count: 3;
          column-gap: 2.5rem;
          column-rule: 1px solid rgba(128, 0, 128, 0.2);
          text-align: center;
        }
        
        .poem-text {
          text-align: center;
          font-size: 1.125rem;
          line-height: 1.75;
          color: #4A235A;
        }
        
        /* Fix for how markdown content is rendered */
        .poem-text p {
          margin-bottom: 1.5rem;
          break-inside: avoid;
          text-align: center;
          display: block;
        }
        
        @media (max-width: 1024px) {
          .poem-content {
            column-count: 2;
          }
        }
        
        @media (max-width: 768px) {
          .poem-content {
            column-count: 1;
          }
        }
      `}</style>
    </>
  );
};

export default PoemView;
