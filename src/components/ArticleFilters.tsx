
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ArticleFiltersProps {
  categories: { id: number; name: string }[];
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  contentType: string;
  onContentTypeChange: (type: string) => void;
}

const ArticleFilters: React.FC<ArticleFiltersProps> = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  dateFilter, 
  onDateFilterChange,
  contentType,
  onContentTypeChange
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div className="w-full lg:w-1/3 flex flex-col">
        <Label htmlFor="content-type-filter" className="mb-2">סוג תוכן</Label>
        <Select
          value={contentType}
          onValueChange={(value) => onContentTypeChange(value)}
          dir="rtl"
        >
          <SelectTrigger id="content-type-filter" className="text-right h-10 filter-input">
            <SelectValue placeholder="מאמר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article">מאמר</SelectItem>
            <SelectItem value="poem">שיר</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full lg:w-1/3 flex flex-col">
        <Label htmlFor="category-filter" className="mb-2">סינון לפי קטגוריה</Label>
        <Select
          value={selectedCategory?.toString() || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? null : Number(value))}
          dir="rtl"
        >
          <SelectTrigger id="category-filter" className="text-right h-10 filter-input">
            <SelectValue placeholder="כל הקטגוריות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full lg:w-1/3 flex flex-col">
        <Label htmlFor="date-filter" className="mb-2">סינון לפי תאריך</Label>
        <Select
          value={dateFilter}
          onValueChange={(value) => onDateFilterChange(value)}
          dir="rtl"
        >
          <SelectTrigger id="date-filter" className="text-right h-10 filter-input">
            <SelectValue placeholder="כל הזמנים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הזמנים</SelectItem>
            <SelectItem value="week">השבוע האחרון</SelectItem>
            <SelectItem value="month">החודש האחרון</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ArticleFilters;
