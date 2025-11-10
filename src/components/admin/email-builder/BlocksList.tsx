import { EmailBlock } from '@/types/emailBlock';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Edit, Trash2, GripVertical } from 'lucide-react';

interface BlocksListProps {
  blocks: EmailBlock[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function BlocksList({ blocks, onMoveUp, onMoveDown, onEdit, onDelete }: BlocksListProps) {
  const getBlockLabel = (block: EmailBlock) => {
    switch (block.type) {
      case 'header': return 'כותרת';
      case 'subtitle': return 'תת כותרת';
      case 'text': return 'טקסט';
      case 'image': return 'תמונה';
      case 'cta': return 'כפתור';
      case 'spacer': return 'מרווח';
      case 'footer': return 'פוטר';
      default: return 'בלוק';
    }
  };

  const getBlockPreview = (block: EmailBlock) => {
    switch (block.type) {
      case 'header':
      case 'subtitle':
      case 'text':
      case 'footer':
        return block.content?.substring(0, 50) || 'ללא תוכן';
      case 'image':
        return block.imageUrl 
          ? (block.imageUrl.startsWith('{{') ? block.imageUrl : 'תמונה הועלתה')
          : 'ללא תמונה';
      case 'cta':
        return block.content || 'כפתור';
      case 'spacer':
        return `גובה: ${block.styles.padding}`;
      default:
        return '';
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>עדיין לא הוספת בלוקים</p>
        <p className="text-sm mt-1">לחץ על הכפתורים בצד שמאל להוספת בלוקים</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <Card key={block.id} className="p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="cursor-move text-muted-foreground">
              <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{getBlockLabel(block)}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {getBlockPreview(block)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(index)}
                disabled={index === blocks.length - 1}
                className="h-8 w-8"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(index)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(index)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Visual preview of the block */}
          <div className="mt-2 text-xs opacity-70 border border-border rounded p-2 overflow-hidden">
            {block.type === 'image' && block.imageUrl && (
              <img src={block.imageUrl} alt="Preview" className="max-h-20 object-contain mx-auto" />
            )}
            {block.type !== 'image' && block.content && (
              <div style={{ textAlign: block.styles.textAlign }}>
                {block.content.substring(0, 100)}
                {block.content.length > 100 && '...'}
              </div>
            )}
            {block.type === 'spacer' && (
              <div className="text-center text-muted-foreground">מרווח ריק</div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
