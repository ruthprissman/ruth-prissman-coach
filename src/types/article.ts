
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
  type?: string; // Added type field
  image_url?: string | null; // Added image_url field
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
  type?: string; // Added type field
  image_url?: string | null; // Added image_url field
  categories?: Category; // Add the joined category data
  article_publications?: ArticlePublication[];
  staticLinks?: Array<{id: number, fixed_text: string, url: string}>; // Updated to use fixed_text instead of title
}

// Form data interface with proper types for form inputs
export interface ArticleFormData {
  title: string;
  content_markdown: string | undefined;
  category_id: string | 'none'; // Updated to use 'none' instead of empty string
  scheduled_publish: string | null;
  contact_email: string | null;
  publish_locations: PublicationFormData[];
  type?: string; // Added type field
  image_url?: string | null; // Added image_url field
}

export type PublishLocationType = 'Website' | 'Email' | 'WhatsApp' | 'All' | 'Other';

export interface PublicationFormData {
  id?: number;
  publish_location: PublishLocationType;
  scheduled_date: Date | null; // Full date and time
  scheduled_time?: string; // Time component (HH:mm format)
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
