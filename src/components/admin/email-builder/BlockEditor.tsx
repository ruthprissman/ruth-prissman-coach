import { EmailBlock, DEFAULT_FONTS, FONT_SIZES } from '@/types/emailBlock';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GradientPicker } from './GradientPicker';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlockEditorProps {
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onUpdate, onClose }: BlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleStyleChange = (key: keyof EmailBlock['styles'], value: string) => {
    onUpdate({
      ...block,
      styles: {
        ...block.styles,
        [key]: value,
      },
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'שגיאה',
        description: 'יש להעלות קובץ תמונה בלבד',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `email-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('site_imgs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site_imgs')
        .getPublicUrl(filePath);

      onUpdate({
        ...block,
        imageUrl: publicUrl,
      });

      toast({
        title: 'הצלחה',
        description: 'התמונה הועלתה בהצלחה',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהעלאת התמונה',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onUpdate({
      ...block,
      imageUrl: undefined,
    });
  };

  const getBlockTitle = () => {
    switch (block.type) {
      case 'header': return 'עריכת כותרת';
      case 'subtitle': return 'עריכת תת כותרת';
      case 'text': return 'עריכת טקסט';
      case 'image': return 'עריכת תמונה';
      case 'cta': return 'עריכת כפתור';
      case 'spacer': return 'עריכת מרווח';
      case 'footer': return 'עריכת פוטר';
      default: return 'עריכת בלוק';
    }
  };

  return (
    <div className="space-y-4 bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{getBlockTitle()}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content field - not for spacer */}
      {block.type !== 'spacer' && block.type !== 'image' && (
        <div>
          <Label>תוכן</Label>
          {block.type === 'text' ? (
            <Textarea
              value={block.content || ''}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              placeholder="הזן טקסט..."
              className="mt-1 min-h-[100px]"
              dir="rtl"
            />
          ) : (
            <Input
              value={block.content || ''}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              placeholder="הזן תוכן..."
              className="mt-1"
              dir="rtl"
            />
          )}
        </div>
      )}

      {/* Image upload or placeholder */}
      {block.type === 'image' && (
        <div className="space-y-4">
          <div>
            <Label>URL תמונה או Placeholder</Label>
            <Input
              value={block.imageUrl || ''}
              onChange={(e) => onUpdate({ ...block, imageUrl: e.target.value })}
              placeholder="{{image}} או https://..."
              className="mt-1"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">
              השתמש ב-{`{{image}}`} לטעינת תמונה דינמית או הזן URL ישירות
            </p>
          </div>

          <div className="border-t pt-4">
            <Label>או העלה תמונה</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="cursor-pointer mt-2"
            />
            {uploading && (
              <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                מעלה תמונה...
              </div>
            )}
          </div>

          {/* Image size controls */}
          <div className="border-t pt-4 space-y-3">
            <Label>גודל תמונה</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">רוחב</Label>
                <Input
                  value={block.imageWidth || '100%'}
                  onChange={(e) => onUpdate({ ...block, imageWidth: e.target.value })}
                  placeholder="100% או 400px"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">גובה</Label>
                <Input
                  value={block.imageHeight || 'auto'}
                  onChange={(e) => onUpdate({ ...block, imageHeight: e.target.value })}
                  placeholder="auto או 300px"
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              דוגמאות: 100%, 50%, 400px, auto
            </p>
          </div>

          {/* Border radius control */}
          <div className="border-t pt-4">
            <Label>פינות עגולות</Label>
            <Input
              value={block.imageBorderRadius || '0'}
              onChange={(e) => onUpdate({ ...block, imageBorderRadius: e.target.value })}
              placeholder="0, 8px, 16px, 50%"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              דוגמאות: 0 (ללא), 8px (קלות), 16px (בינוניות), 50% (עיגול מלא)
            </p>
          </div>

          {block.imageUrl && !block.imageUrl.startsWith('{{') && (
            <div>
              <Label>תצוגה מקדימה</Label>
              <img
                src={block.imageUrl}
                alt="Block preview"
                className="w-full max-h-48 object-contain rounded border border-border mt-2"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="w-full mt-2"
              >
                <X className="h-4 w-4 ml-2" />
                הסר תמונה
              </Button>
            </div>
          )}
        </div>
      )}

      {/* CTA button URL */}
      {block.type === 'cta' && (
        <div>
          <Label>קישור הכפתור</Label>
          <Input
            type="url"
            value={block.buttonUrl || ''}
            onChange={(e) => onUpdate({ ...block, buttonUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1"
            dir="ltr"
          />
        </div>
      )}

      {/* Font family - not for spacer or image */}
      {block.type !== 'spacer' && block.type !== 'image' && (
        <div>
          <Label>גופן</Label>
          <Select
            value={block.styles.fontFamily}
            onValueChange={(value) => handleStyleChange('fontFamily', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font size - not for spacer or image */}
      {block.type !== 'spacer' && block.type !== 'image' && (
        <div>
          <Label>גודל</Label>
          <Select
            value={block.styles.fontSize}
            onValueChange={(value) => handleStyleChange('fontSize', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font Weight (Bold) - not for spacer or image */}
      {block.type !== 'spacer' && block.type !== 'image' && (
        <div>
          <Label>עובי גופן</Label>
          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant={block.styles.fontWeight === 'normal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('fontWeight', 'normal')}
              className="flex-1"
            >
              רגיל
            </Button>
            <Button
              type="button"
              variant={block.styles.fontWeight === '600' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('fontWeight', '600')}
              className="flex-1"
            >
              בינוני
            </Button>
            <Button
              type="button"
              variant={block.styles.fontWeight === 'bold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('fontWeight', 'bold')}
              className="flex-1"
            >
              <strong>מודגש</strong>
            </Button>
          </div>
        </div>
      )}

      {/* Text color - not for spacer or image */}
      {block.type !== 'spacer' && block.type !== 'image' && (
        <div>
          <Label>צבע טקסט</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="color"
              value={block.styles.color}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={block.styles.color}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="flex-1 font-mono"
              placeholder="#333333"
            />
          </div>
        </div>
      )}

      {/* Background - gradient or solid */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label>רקע</Label>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStyleChange('backgroundColor', 'transparent')}
              className="text-xs h-6"
            >
              ללא רקע
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const isGradient = block.styles.backgroundColor.includes('gradient');
                const isTransparent = block.styles.backgroundColor === 'transparent';
                if (isTransparent || isGradient) {
                  handleStyleChange('backgroundColor', '#ffffff');
                } else {
                  handleStyleChange('backgroundColor', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
                }
              }}
              className="text-xs h-6"
            >
              {block.styles.backgroundColor.includes('gradient') ? 'צבע אחיד' : 'גרדיאנט'}
            </Button>
          </div>
        </div>

        {block.styles.backgroundColor === 'transparent' ? (
          <div className="p-4 border border-dashed border-border rounded text-center text-sm text-muted-foreground">
            רקע שקוף - הבלוק יהיה ללא רקע
          </div>
        ) : block.styles.backgroundColor.includes('gradient') ? (
          <GradientPicker
            value={block.styles.backgroundColor}
            onChange={(value) => handleStyleChange('backgroundColor', value)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={block.styles.backgroundColor}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={block.styles.backgroundColor}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="flex-1 font-mono"
              placeholder="#ffffff"
            />
          </div>
        )}
      </div>

      {/* Text alignment - not for spacer */}
      {block.type !== 'spacer' && (
        <div>
          <Label>יישור</Label>
          <div className="flex gap-2 mt-1">
            <Button
              variant={block.styles.textAlign === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'right')}
              className="flex-1"
            >
              ימין
            </Button>
            <Button
              variant={block.styles.textAlign === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'center')}
              className="flex-1"
            >
              מרכז
            </Button>
            <Button
              variant={block.styles.textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'left')}
              className="flex-1"
            >
              שמאל
            </Button>
          </div>
        </div>
      )}

      {/* Padding */}
      <div>
        <Label>ריווח פנימי</Label>
        <Input
          value={block.styles.padding}
          onChange={(e) => handleStyleChange('padding', e.target.value)}
          placeholder="20px"
          className="mt-1"
        />
      </div>
    </div>
  );
}
