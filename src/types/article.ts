
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
  created_at?: string;
  categories?: Category; // Add the joined category data
}

// Form data interface with proper types for form inputs
export interface ArticleFormData {
  title: string;
  content_markdown: string;
  category_id: string; // Using string for select inputs
  scheduled_publish: string | null;
  contact_email: string | null;
}
