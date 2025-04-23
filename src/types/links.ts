
export interface SiteLink {
  id: number;
  fixed_text: string;
  url: string | null;
  list_type: 'site' | 'all' | string;
}
