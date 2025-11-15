import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GradientPickerProps {
  value: string;
  onChange: (gradient: string) => void;
}

export function GradientPicker({ value, onChange }: GradientPickerProps) {
  // Parse existing gradient or use defaults
  const parseGradient = (gradientStr: string) => {
    if (!gradientStr.includes('gradient')) {
      return {
        startColor: gradientStr || '#667eea',
        endColor: gradientStr || '#764ba2',
        angle: '135deg',
      };
    }
    
    const angleMatch = gradientStr.match(/(\d+deg)/);
    const colorsMatch = gradientStr.match(/#[0-9a-fA-F]{6}/g);
    
    return {
      startColor: colorsMatch?.[0] || '#667eea',
      endColor: colorsMatch?.[1] || '#764ba2',
      angle: angleMatch?.[1] || '135deg',
    };
  };

  const parsed = parseGradient(value);
  const [startColor, setStartColor] = useState(parsed.startColor);
  const [endColor, setEndColor] = useState(parsed.endColor);
  const [angle, setAngle] = useState(parsed.angle);

  // Update local state when value prop changes (e.g., when loading a template)
  useEffect(() => {
    const parsed = parseGradient(value);
    setStartColor(parsed.startColor);
    setEndColor(parsed.endColor);
    setAngle(parsed.angle);
  }, [value]);

  const updateGradient = (start: string, end: string, deg: string) => {
    const gradient = `linear-gradient(${deg}, ${start} 0%, ${end} 100%)`;
    onChange(gradient);
  };

  const handleStartColorChange = (newColor: string) => {
    setStartColor(newColor);
    updateGradient(newColor, endColor, angle);
  };

  const handleEndColorChange = (newColor: string) => {
    setEndColor(newColor);
    updateGradient(startColor, newColor, angle);
  };

  const handleAngleChange = (newAngle: string) => {
    setAngle(newAngle);
    updateGradient(startColor, endColor, newAngle);
  };

  return (
    <div className="space-y-3">
      <Label>רקע גרדיאנט</Label>
      
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">צבע התחלה</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="color"
              value={startColor}
              onChange={(e) => handleStartColorChange(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={startColor}
              onChange={(e) => handleStartColorChange(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#667eea"
            />
          </div>
        </div>

        <div className="flex items-center justify-center pt-5">
          <span className="text-muted-foreground">←</span>
        </div>

        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">צבע סיום</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="color"
              value={endColor}
              onChange={(e) => handleEndColorChange(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={endColor}
              onChange={(e) => handleEndColorChange(e.target.value)}
              className="flex-1 font-mono text-sm"
              placeholder="#764ba2"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">כיוון</Label>
        <Select value={angle} onValueChange={handleAngleChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0deg">↓ מלמעלה למטה</SelectItem>
            <SelectItem value="90deg">← משמאל לימין</SelectItem>
            <SelectItem value="135deg">↙ אלכסוני 1</SelectItem>
            <SelectItem value="180deg">↑ מלמטה למעלה</SelectItem>
            <SelectItem value="270deg">→ מימין לשמאל</SelectItem>
            <SelectItem value="45deg">↗ אלכסוני 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="w-full h-16 rounded border border-border"
        style={{ background: `linear-gradient(${angle}, ${startColor} 0%, ${endColor} 100%)` }}
      />
    </div>
  );
}
