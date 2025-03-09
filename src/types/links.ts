
export interface StaticLink {
  id: number;
  name: string;
  fixed_text: string;
  url: string | null;
  list_type: "general" | "story" | "all";
}
