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

export interface ProfessionalContent {
  id: number;
  title: string;
  content_markdown: string;
  category_id: number | null;
  scheduled_publish: string | null;
  published_at: string | null;
  contact_email: string | null;
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
  staticLinks?: Array<{id: number, title: string, url: string}>; // Add the staticLinks property
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

// Interface for failed publications that need retry
export interface FailedPublication {
  id: number;
  content_id: number;
  article_title: string;
  publish_location: PublishLocationType;
  scheduled_date: string;
  error_message?: string;
}

// Adding new interface for the structure returned by Supabase
export interface PublicationWithContent {
  id: number;
  content_id: number;
  publish_location: string;
  scheduled_date: string;
  professional_content?: ProfessionalContent | null; // Changed to a single object that might be null
}
