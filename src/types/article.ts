
export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export interface PublishLocation {
  id?: number;
  content_id: number;
  location: string; // website, email, whatsapp, etc.
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
  publish_locations?: PublishLocation[];
}

// Form data interface with proper types for form inputs
export interface ArticleFormData {
  title: string;
  content_markdown: string | undefined; // עדכנו כדי לאפשר undefined כערך
  category_id: string | 'none'; // Updated to use 'none' instead of empty string
  scheduled_publish: string | null;
  contact_email: string | null;
  publish_locations: {
    website: boolean;
    email: boolean;
    whatsapp: boolean;
    other: boolean;
  };
}

export type PublishLocationType = 'website' | 'email' | 'whatsapp' | 'other';
