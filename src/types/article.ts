
export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface Article {
  id: number;
  title: string;
  content_markdown: string;
  category_id: number | null;
  scheduled_publish: string | null;
  published_at: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

// Form data interface with proper types for form inputs
export interface ArticleFormData {
  title: string;
  content_markdown: string;
  category_id: string | null;  // Using string type since form inputs use strings
  scheduled_publish: Date | null;
  published_at: Date | null;
  contact_email: string | null;
}
