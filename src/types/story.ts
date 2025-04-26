
export interface Story {
  id: number;
  title: string;
  description: string;  // Changed from summary
  publish_date: string;
  pdf_url: string;
  image_url: string;
  created_at: string;
}

export interface NewStory {
  title: string;
  description: string;  // Changed from summary
  publish_date: string;
  pdf_url?: string;
  image_url?: string;
}
