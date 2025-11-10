export type BlockType = 'header' | 'text' | 'image' | 'cta' | 'spacer' | 'footer';

export interface EmailBlockStyles {
  fontFamily: string;
  fontSize: string;
  color: string;
  textAlign: 'right' | 'center' | 'left';
  backgroundColor: string;
  padding: string;
  fontWeight: string;
  lineHeight?: string;
}

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: string | null;
  styles: EmailBlockStyles;
  imageUrl?: string;
  buttonUrl?: string;
  buttonText?: string;
}

export interface EmailTemplate {
  id?: string;
  name: string;
  html_content: string;
  blocks: EmailBlock[];
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_FONTS = [
  { value: 'Heebo, Arial, sans-serif', label: 'היבו (Heebo)' },
  { value: 'Alef, Arial, sans-serif', label: 'אלף (Alef)' },
  { value: 'Rubik, Arial, sans-serif', label: 'רוביק (Rubik)' },
  { value: 'Assistant, Arial, sans-serif', label: 'אסיסטנט (Assistant)' },
  { value: 'Frank Ruhl Libre, serif', label: 'פרנק רוהל (Frank Ruhl Libre)' },
  { value: 'Arial, sans-serif', label: 'אריאל (Arial)' },
];

export const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '42px', label: '42' },
  { value: '48px', label: '48' },
];

export const DEFAULT_BLOCK_STYLES: Record<BlockType, Partial<EmailBlockStyles>> = {
  header: {
    fontFamily: 'Heebo, Arial, sans-serif',
    fontSize: '32px',
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontWeight: 'bold',
    lineHeight: '1.4',
  },
  text: {
    fontFamily: 'Heebo, Arial, sans-serif',
    fontSize: '16px',
    color: '#333333',
    textAlign: 'right',
    backgroundColor: 'transparent',
    padding: '20px',
    fontWeight: 'normal',
    lineHeight: '1.6',
  },
  image: {
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: '20px',
  },
  cta: {
    fontFamily: 'Heebo, Arial, sans-serif',
    fontSize: '18px',
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#667eea',
    padding: '15px 40px',
    fontWeight: 'bold',
  },
  spacer: {
    backgroundColor: 'transparent',
    padding: '20px',
  },
  footer: {
    fontFamily: 'Heebo, Arial, sans-serif',
    fontSize: '12px',
    color: '#666666',
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontWeight: 'normal',
    lineHeight: '1.5',
  },
};
