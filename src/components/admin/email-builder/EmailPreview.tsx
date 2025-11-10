import { EmailBlock } from '@/types/emailBlock';

interface EmailPreviewProps {
  blocks: EmailBlock[];
}

export function EmailPreview({ blocks }: EmailPreviewProps) {
  const generateBlockHTML = (block: EmailBlock): string => {
    const styles = {
      fontFamily: block.styles.fontFamily,
      fontSize: block.styles.fontSize,
      color: block.styles.color,
      textAlign: block.styles.textAlign,
      background: block.styles.backgroundColor,
      padding: block.styles.padding,
      fontWeight: block.styles.fontWeight,
      lineHeight: block.styles.lineHeight || '1.5',
    };

    const styleString = Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');

    switch (block.type) {
      case 'header':
      case 'subtitle':
      case 'text':
      case 'footer':
        return `<div style="${styleString}">${block.content || ''}</div>`;

      case 'image':
        if (!block.imageUrl) return '<div style="padding: 20px; text-align: center; color: #999;">ללא תמונה</div>';
        
        const imageDisplay = block.imageUrl.startsWith('{{') 
          ? `<div style="padding: 20px; background: #f0f0f0; text-align: center; border: 2px dashed #ccc; color: #666;">${block.imageUrl}</div>`
          : `<img src="${block.imageUrl}" alt="Email image" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;
        
        return `
          <div style="${styleString}">
            ${imageDisplay}
          </div>
        `;

      case 'cta':
        return `
          <div style="text-align: ${block.styles.textAlign}; padding: ${block.styles.padding}; background: transparent;">
            <a href="${block.buttonUrl || '#'}" 
               style="display: inline-block; ${styleString} text-decoration: none; border-radius: 8px;">
              ${block.content || 'לחץ כאן'}
            </a>
          </div>
        `;

      case 'spacer':
        return `<div style="height: ${block.styles.padding}; background: ${block.styles.backgroundColor};"></div>`;

      default:
        return '';
    }
  };

  const previewHTML = `
    <div style="font-family: Heebo, Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${blocks.map(generateBlockHTML).join('')}
    </div>
  `;

  return (
    <div className="bg-muted p-4 rounded-lg border border-border overflow-auto max-h-[600px]">
      <div 
        className="bg-white"
        dangerouslySetInnerHTML={{ __html: previewHTML }}
      />
    </div>
  );
}
