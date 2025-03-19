import React, { useState, useEffect } from 'react';
import { Check, Loader, Plus, X, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Article, PublishLocationType } from '@/types/article';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PublicationService from '@/services/PublicationService';
import EmailPreviewModal from './EmailPreviewModal';
import { formatInTimeZone } from 'date-fns-tz';
import { he } from 'date-fns/locale';

interface PublishOption {
  id?: number;
  content_id: number;
  publish_location: PublishLocationType;
  scheduled_date?: string | null;
  isSelected: boolean;
  isPublished: boolean;
  isNew?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

const AVAILABLE_LOCATIONS: PublishLocationType[] = ['Website', 'Email', 'WhatsApp', 'Other'];

interface PublishModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ 
  article, 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const { session: authSession } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publishOptions, setPublishOptions] = useState<PublishOption[]>([]);
  const [newLocation, setNewLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [failedLocations, setFailedLocations] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedOptionsForPreview, setSelectedOptionsForPreview] = useState<PublishOption[]>([]);

  const getSupabaseClient = () => {
    return authSession?.access_token 
      ? getSupabaseWithAuth(authSession.access_token)
      : supabase;
  };

  useEffect(() => {
    if (!isOpen || !article) return;

    const fetchPublishOptions = async () => {
      setLoading(true);
      
      try {
        const supabaseClient = getSupabaseClient();
        
        const { data: publishOptionsData, error: optionsError } = await supabaseClient
          .from('article_publications')
          .select('*')
          .eq('content_id', article.id);
          
        if (optionsError) throw optionsError;
        
        const options: PublishOption[] = publishOptionsData?.map(option => ({
          id: option.id,
          content_id: option.content_id,
          publish_location: option.publish_location as PublishLocationType,
          scheduled_date: option.scheduled_date,
          isSelected: false,
          isPublished: !!option.published_date,
        })) || [];
        
        setPublishOptions(options);
      } catch (error: any) {
        console.error('Error fetching publish options:', error);
        toast({
          title: "שגיאה בטעינת אפשרויות פרסום",
          description: error.message || "אנא נסה שוב מאוחר יותר",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPublishOptions();
  }, [article, isOpen, authSession, toast]);

  const handleToggleOption = (index: number) => {
    setPublishOptions(prev => 
      prev.map((option, i) => 
        i === index ? { ...option, isSelected: !option.isSelected } : option
      )
    );
  };

  const handleAddLocation = () => {
    if (!newLocation || !article) return;
    
    const exists = publishOptions.some(opt => opt.publish_location === newLocation);
    
    if (!exists) {
      setPublishOptions(prev => [
        ...prev,
        {
          content_id: article.id,
          publish_location: newLocation as PublishLocationType,
          scheduled_date: new Date().toISOString(),
          isSelected: true,
          isPublished: false,
          isNew: true
        }
      ]);
      
      setNewLocation('');
    } else {
      toast({
        title: "מיקום פרסום קיים",
        description: "מיקום הפרסום הזה כבר קיים ברשימה",
        variant: "destructive",
      });
    }
  };

  const handleRemoveNewLocation = (index: number) => {
    setPublishOptions(prev => prev.filter((_, i) => i !== index));
  };

  const getAvailableLocations = () => {
    const existingLocations = publishOptions.map(opt => opt.publish_location);
    return AVAILABLE_LOCATIONS.filter(loc => !existingLocations.includes(loc));
  };

  const saveNewLocations = async () => {
    if (!article) return;
    
    const supabaseClient = getSupabaseClient();
    const newLocations = publishOptions.filter(opt => opt.isNew);
    
    if (newLocations.length === 0) return;
    
    const locationsToInsert = newLocations.map(loc => ({
      content_id: article.id,
      publish_location: loc.publish_location,
      scheduled_date: loc.scheduled_date || new Date().toISOString(),
    }));
    
    try {
      const { error } = await supabaseClient
        .from('article_publications')
        .insert(locationsToInsert);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving new locations:', error);
      throw error;
    }
  };

  const handlePreviewPublish = () => {
    const selectedOptions = publishOptions.filter(opt => opt.isSelected);
    
    if (selectedOptions.length === 0) {
      toast({
        title: "לא נבחרו מיקומי פרסום",
        description: "יש לבחור לפחות מיקום פרסום אחד",
      });
      return;
    }
    
    const hasEmailOption = selectedOptions.some(opt => opt.publish_location === 'Email');
    
    if (hasEmailOption) {
      setSelectedOptionsForPreview(selectedOptions);
      setIsPreviewModalOpen(true);
    } else {
      handlePublish(selectedOptions);
    }
  };

  const handlePublish = async (optionsToPublish = publishOptions.filter(opt => opt.isSelected)) => {
    if (!article) return;
    
    setIsSubmitting(true);
    setPublishStatus('publishing');
    setFailedLocations([]);
    
    try {
      await saveNewLocations();
      
      if (optionsToPublish.length === 0) {
        toast({
          title: "לא נבחרו מיקומי פרסום",
          description: "יש לבחור לפחות מיקום פרסום אחד",
        });
        setIsSubmitting(false);
        setPublishStatus('idle');
        return;
      }
      
      const failedOnes: string[] = [];
      
      const publicationService = PublicationService;
      publicationService.start(authSession?.access_token);
      
      console.log('PublishModal: Starting publication process for', optionsToPublish.length, 'locations');
      
      for (const option of optionsToPublish) {
        try {
          console.log('PublishModal: Publishing to', option.publish_location);
          
          if (option.id) {
            await publicationService.retryPublication(option.id);
            console.log('PublishModal: Publication with ID completed:', option.id);
          } else {
            const supabaseClient = getSupabaseClient();
            const { data, error } = await supabaseClient
              .from('article_publications')
              .select('id')
              .eq('content_id', article.id)
              .eq('publish_location', option.publish_location)
              .single();
              
            if (error) throw error;
            
            if (data?.id) {
              await publicationService.retryPublication(data.id);
              console.log('PublishModal: Publication with found ID completed:', data.id);
            } else {
              console.log('PublishModal: No publication ID found, creating direct publication');
              
              const { data: newPub, error: insertError } = await supabaseClient
                .from('article_publications')
                .insert({
                  content_id: article.id,
                  publish_location: option.publish_location,
                  scheduled_date: new Date().toISOString()
                })
                .select('id')
                .single();
                
              if (insertError) throw insertError;
              
              if (newPub?.id) {
                await publicationService.retryPublication(newPub.id);
                console.log('PublishModal: New publication completed with ID:', newPub.id);
              } else {
                throw new Error(`Failed to create publication record for ${option.publish_location}`);
              }
            }
          }
        } catch (error: any) {
          console.error(`Error publishing to ${option.publish_location}:`, error);
          failedOnes.push(option.publish_location);
        }
      }
      
      if (failedOnes.length > 0) {
        setFailedLocations(failedOnes);
        setPublishStatus('error');
        toast({
          title: "פרסום נכשל חלקית",
          description: `פרסום נכשל בערוצים: ${failedOnes.join(', ')}`,
          variant: "destructive",
        });
      } else {
        setPublishStatus('success');
        toast({
          title: "פרסום הושלם בהצלחה",
          description: "המאמר פורסם בכל המיקומים שנבחרו",
        });
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error during publishing:', error);
      setPublishStatus('error');
      toast({
        title: "שגיאה בפרסום",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryFailed = () => {
    setPublishOptions(prev => 
      prev.map(opt => ({
        ...opt,
        isSelected: failedLocations.includes(opt.publish_location)
      }))
    );
    setPublishStatus('idle');
    setFailedLocations([]);
  };

  const formatScheduledDate = (date: string | null | undefined) => {
    if (!date) return '';
    return formatInTimeZone(new Date(date), 'Asia/Jerusalem', 'dd/MM/yyyy', { locale: he });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>בחר היכן לפרסם את המאמר</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="py-6 flex justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {publishOptions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      אין מיקומי פרסום מוגדרים. הוסף מיקום חדש כדי להתחיל.
                    </div>
                  ) : (
                    publishOptions.map((option, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between border p-3 rounded-md"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`location-${index}`}
                            checked={option.isSelected}
                            onCheckedChange={() => handleToggleOption(index)}
                            disabled={isSubmitting || option.isPublished}
                          />
                          <Label htmlFor={`location-${index}`} className="mr-2">
                            {option.publish_location}
                            {option.scheduled_date && (
                              <span className="text-xs text-gray-500 mr-2">
                                ({formatScheduledDate(option.scheduled_date)})
                              </span>
                            )}
                          </Label>
                          
                          {option.isPublished && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 mr-2">
                              <Check className="h-3 w-3 ml-1" />
                              פורסם
                            </Badge>
                          )}
                        </div>
                        
                        {option.isNew && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveNewLocation(index)}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex items-end gap-2 border-t pt-4">
                  <div className="flex-1">
                    <Label htmlFor="new-location" className="mb-2 block">
                      הוסף מיקום פרסום
                    </Label>
                    <Select 
                      value={newLocation} 
                      onValueChange={(value: string) => setNewLocation(value)}
                      disabled={isSubmitting || getAvailableLocations().length === 0}
                    >
                      <SelectTrigger id="new-location">
                        <SelectValue placeholder="בחר מיקום" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableLocations().map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddLocation} 
                    disabled={!newLocation || isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף
                  </Button>
                </div>
              </div>
              
              {publishStatus === 'publishing' && (
                <div className="flex justify-center py-2 text-primary">
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  מפרסם...
                </div>
              )}
              
              {publishStatus === 'success' && (
                <div className="flex justify-center py-2 text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  הפרסום הושלם בהצלחה!
                </div>
              )}
              
              {publishStatus === 'error' && (
                <div className="space-y-2">
                  <div className="flex justify-center py-2 text-destructive">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    הפרסום נכשל באחד או יותר מהערוצים
                  </div>
                  {failedLocations.length > 0 && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={handleRetryFailed}
                        className="mx-auto"
                      >
                        נסה שוב את הערוצים שנכשלו
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button 
              type="button" 
              onClick={handlePreviewPublish}
              disabled={isSubmitting || publishOptions.every(opt => !opt.isSelected)}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {publishOptions.some(opt => opt.isSelected && opt.publish_location === 'Email') ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </>
              )}
              {isSubmitting ? "מפרסם..." : (
                publishOptions.some(opt => opt.isSelected && opt.publish_location === 'Email') ? 
                "תצוגה מקדימה ופרסום" : "פרסם עכשיו"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {article && (
        <EmailPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          onConfirm={() => {
            setIsPreviewModalOpen(false);
            handlePublish(selectedOptionsForPreview);
          }}
          article={article}
        />
      )}
    </>
  );
};

export default PublishModal;
