
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ArticleFiltersProps {
  categories: { id: number; name: string }[];
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
}

const ArticleFilters: React.FC<ArticleFiltersProps> = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  dateFilter, 
  onDateFilterChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="w-full sm:w-1/2">
        <Label htmlFor="category-filter" className="mb-2 block">סינון לפי קטגוריה</Label>
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
      
      <div className="w-full sm:w-1/2">
        <Label htmlFor="date-filter" className="mb-2 block">סינון לפי תאריך</Label>
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
