import React, { useState, useEffect } from 'react';
import { Check, Loader, Plus, X, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Article, PublishLocationType } from '@/types/article';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PublicationService from '@/services/PublicationService';
import EmailPreviewModal from './EmailPreviewModal';
import WhatsAppPublicationModal from './WhatsAppPublicationModal';
import { formatInTimeZone } from 'date-fns-tz';
import { he } from 'date-fns/locale';
import { supabaseClient, getFreshSupabaseClient, getTokenInfo } from '@/lib/supabaseClient';

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

const AVAILABLE_LOCATIONS: PublishLocationType[] = ['Website', 'Email', 'WhatsApp', 'All', 'Other'];

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
  const [tokenStatus, setTokenStatus] = useState<{isValid: boolean, lastRefresh: string}>({ 
    isValid: false, 
    lastRefresh: 'unknown' 
  });
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppSplits, setWhatsAppSplits] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !article) return;

    const fetchPublishOptions = async () => {
      setLoading(true);
      
      try {
        const tokenInfo = getTokenInfo();
        setTokenStatus({
          isValid: !tokenInfo.isExpiringSoon,
          lastRefresh: tokenInfo.lastRefresh
        });
        
        console.log('[PublishModal] Current token status:', tokenInfo);
        
        const client = supabaseClient();
        
        const { data: publishOptionsData, error: optionsError } = await client
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
          title: "שג��אה בטעינת אפשרויות פרסום",
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
            scheduled_date: null, // Let user choose when to schedule
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
    
    const client = supabaseClient();
    const newLocations = publishOptions.filter(opt => opt.isNew);
    
    if (newLocations.length === 0) return;
    
    const locationsToInsert = newLocations.map(loc => {
      // For Website publishing without scheduling, publish immediately
      if (loc.publish_location === 'Website' && !loc.scheduled_date) {
        return {
          content_id: article.id,
          publish_location: loc.publish_location,
          scheduled_date: null, // No scheduling for immediate website publishing
        };
      }
      
      return {
        content_id: article.id,
        publish_location: loc.publish_location,
        scheduled_date: loc.scheduled_date || null,
      };
    });
    
    try {
      const { error } = await client
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
    const hasWhatsAppOption = selectedOptions.some(opt => opt.publish_location === 'WhatsApp');
    const hasAllOption = newLocation === 'All' || publishOptions.some(opt => opt.isSelected && opt.publish_location === 'All');
    
    if (hasEmailOption) {
      setSelectedOptionsForPreview(selectedOptions);
      setIsPreviewModalOpen(true);
    } else if (hasWhatsAppOption || hasAllOption) {
      setIsWhatsAppModalOpen(true);
    } else {
      handlePublish(selectedOptions);
    }
  };

  const handleContinueFromWhatsApp = (splits: string[]) => {
    setWhatsAppSplits(splits);
    setIsWhatsAppModalOpen(false);
    
    handlePublish(publishOptions.filter(opt => opt.isSelected));
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
      
      const freshClient = await getFreshSupabaseClient();
      const { data } = await freshClient.auth.getSession();
      const freshToken = data.session?.access_token;
      
      if (!freshToken) {
        throw new Error('Failed to obtain a valid token for publication');
      }
      
      console.log('PublishModal: Starting publication with fresh token, length:', freshToken.length);
      publicationService.start(freshToken);
      
      console.log('PublishModal: Starting publication process for', optionsToPublish.length, 'locations');
      
      for (const option of optionsToPublish) {
        try {
          console.log('PublishModal: Publishing to', option.publish_location);
          
          // Handle immediate website publishing (no scheduling)
          if (option.publish_location === 'Website' && !option.scheduled_date) {
            console.log('PublishModal: Immediate website publishing');
            
            // Publish directly to website
            const freshClient = await getFreshSupabaseClient();
            const { error: publishError } = await freshClient
              .from('professional_content')
              .update({ published_at: new Date().toISOString() })
              .eq('id', article.id);
              
            if (publishError) throw publishError;
            
            // Mark publication as completed
            if (option.id) {
              await freshClient
                .from('article_publications')
                .update({ published_date: new Date().toISOString() })
                .eq('id', option.id);
            } else {
              // For new publications, first save then mark as published
              const { data, error } = await freshClient
                .from('article_publications')
                .select('id')
                .eq('content_id', article.id)
                .eq('publish_location', option.publish_location)
                .single();
                
              if (error) throw error;
              
              if (data?.id) {
                await freshClient
                  .from('article_publications')
                  .update({ published_date: new Date().toISOString() })
                  .eq('id', data.id);
              }
            }
            
            console.log('PublishModal: Website published immediately');
            continue;
          }
          
          if (option.id) {
            await publicationService.retryPublication(option.id);
            console.log('PublishModal: Publication with ID completed:', option.id);
          } else {
            const freshClient = await getFreshSupabaseClient();
            
            const { data, error } = await freshClient
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
              
              const { data: newPub, error: insertError } = await freshClient
                .from('article_publications')
                .insert({
                  content_id: article.id,
                  publish_location: option.publish_location,
                  scheduled_date: option.scheduled_date // Allow null for immediate publishing
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
      
      // Get detailed email delivery status for better messaging
      let emailDeliveryMessage = '';
      if (optionsToPublish.some(opt => opt.publish_location === 'Email')) {
        try {
          const databaseService = new (await import('@/services/DatabaseService')).DatabaseService();
          const totalSubscribers = (await databaseService.fetchActiveSubscribers()).length;
          const deliveredCount = (await databaseService.getSuccessfulEmailRecipients(article.id)).length;
          const undeliveredCount = totalSubscribers - deliveredCount;
          
          if (deliveredCount === totalSubscribers) {
            emailDeliveryMessage = `המייל נשלח לכל ${totalSubscribers} הנמענים`;
          } else if (deliveredCount > 0) {
            emailDeliveryMessage = `המייל נשלח ל-${deliveredCount} מתוך ${totalSubscribers} נמענים`;
          } else {
            emailDeliveryMessage = 'שליחת המייל נכשלה';
          }
        } catch (emailStatusError) {
          console.error('Error getting email status:', emailStatusError);
        }
      }
      
      if (failedOnes.length > 0) {
        setFailedLocations(failedOnes);
        setPublishStatus('error');
        let errorDescription = `פרסום נכשל בערוצים: ${failedOnes.join(', ')}`;
        if (emailDeliveryMessage) {
          errorDescription += `. ${emailDeliveryMessage}`;
        }
        toast({
          title: "פרסום נכשל חלקית",
          description: errorDescription,
          variant: "destructive",
        });
      } else {
        setPublishStatus('success');
        let successDescription = "המאמר פורסם בכל המיקומים שנבחרו";
        if (emailDeliveryMessage) {
          successDescription += `. ${emailDeliveryMessage}`;
        }
        toast({
          title: "פרסום הושלם בהצלחה",
          description: successDescription,
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
    return formatInTimeZone(new Date(date), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm', { locale: he });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>תזמן פרסום מאמר</DialogTitle>
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
                      אין מיקומי פרסום מוגדרים. ה��סף מיקום חדש כדי להתחיל.
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
                            disabled={isSubmitting}
                          />
                           <Label htmlFor={`location-${index}`} className="mr-2">
                            {option.publish_location}
                            <div className="text-xs text-gray-500 mt-1">
                              {option.scheduled_date ? (
                                <>מתוכנן ל: {formatScheduledDate(option.scheduled_date)}</>
                              ) : (
                                <>יפורסם מיד</>
                              )}
                            </div>
                          </Label>
                          
                          {option.isPublished && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <Check className="h-3 w-3 ml-1" />
                                פורסם
                              </Badge>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                פרסם שוב
                              </Badge>
                            </div>
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
              {isSubmitting ? "מתזמן פרסום..." : (
                publishOptions.some(opt => opt.isSelected && opt.publish_location === 'Email') ? 
                "תצוגה מקדימה ותזמן" : "תזמן פרסום"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {article && (
        <>
          <EmailPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            onConfirm={() => {
              setIsPreviewModalOpen(false);
              handlePublish(selectedOptionsForPreview);
            }}
            article={article}
          />
          
          <WhatsAppPublicationModal
            isOpen={isWhatsAppModalOpen}
            onClose={() => setIsWhatsAppModalOpen(false)}
            onContinue={handleContinueFromWhatsApp}
            article={article}
          />
        </>
      )}
    </>
  );
};

export default PublishModal;
