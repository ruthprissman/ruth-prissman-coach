
export interface Story {
  id: number;
  title: string;
  summary: string;
  publish_date: string;  // Keep this as is for the interface
  pdf_url: string;
  image_url: string;
  created_at: string;
}

export interface NewStory {
  title: string;
  summary: string;
  publish_date: string;  // Keep this as is for the interface
  pdf_url?: string;
  image_url?: string;
}
