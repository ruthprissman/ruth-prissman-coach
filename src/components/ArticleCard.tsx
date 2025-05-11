
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
  basePath: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {article.image_url && (
        <div className="relative pt-[56%] w-full overflow-hidden">
          <img 
            src={article.image_url} 
            alt={article.title || 'תמונת המאמר'}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="text-2xl font-alef text-right text-[#4A235A] line-clamp-2">
          {article.title || 'ללא כותרת'}
        </div>
        <div className="text-sm text-muted-foreground line-clamp-1 text-right">
          {new Date(article.article_publications[0].published_date).toLocaleDateString('he-IL')}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-right line-clamp-3 text-gray-600 mb-4">
          {article.description || article.content?.substring(0, 150) || 'אין תוכן'}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex flex-wrap gap-1 justify-end min-h-[32px] w-full">
          {article.categories && article.categories.map((category, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs bg-purple-50 text-purple-dark border-purple-light"
            >
              {category.name}
            </Badge>
          ))}
        </div>
        <div className="flex justify-end w-full">
          <span className="text-sm text-[#4A235A] font-medium hover:underline">קרא עוד &gt;</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
