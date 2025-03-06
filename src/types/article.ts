
export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface ArticlePublication {
  id?: number;
  content_id: number;
  publish_location: PublishLocationType;
  scheduled_date: string | null;
  published_date: string | null;
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
  article_publications?: ArticlePublication[];
}

// Form data interface with proper types for form inputs
export interface ArticleFormData {
  title: string;
  content_markdown: string | undefined;
  category_id: string | 'none'; // Updated to use 'none' instead of empty string
  scheduled_publish: string | null;
  contact_email: string | null;
  publish_locations: PublicationFormData[];
}

export type PublishLocationType = 'Website' | 'Email' | 'WhatsApp' | 'Other';

export interface PublicationFormData {
  id?: number;
  publish_location: PublishLocationType;
  scheduled_date: Date | null;
  published_date: string | null;
  isDeleted?: boolean;
}
