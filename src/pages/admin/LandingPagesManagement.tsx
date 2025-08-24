import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Mail, Eye } from 'lucide-react';
import { landingPages, getLandingPageById } from '@/config/landingPages';
import LandingPageEmailModal from '@/components/LandingPageEmailModal';
import { useToast } from '@/hooks/use-toast';

const LandingPagesManagement = () => {
  const { toast } = useToast();
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const selectedPage = selectedPageId ? getLandingPageById(selectedPageId) : null;

  const handlePageSelect = (pageId: string) => {
    setSelectedPageId(pageId);
    const page = getLandingPageById(pageId);
    if (page) {
      const html = page.generateHtml();
      setPreviewHtml(html);
    }
  };

  const handleExportHtml = () => {
    if (!selectedPage || !previewHtml) {
      toast({
        title: "שגיאה",
        description: "אנא בחרי דף נחיתה תחילה",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPage.name}-email.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "הורדה הושלמה",
      description: `קובץ HTML נוצר בהצלחה עבור ${selectedPage.name}`,
    });
  };

  const handleSendEmail = () => {
    if (!selectedPage) {
      toast({
        title: "שגיאה", 
        description: "אנא בחרי דף נחיתה תחילה",
        variant: "destructive"
      });
      return;
    }
    setIsEmailModalOpen(true);
  };

  return (
    <AdminLayout title="ניהול דפי נחיתה">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>בחירת דף נחיתה</CardTitle>
            <CardDescription>
              בחרי דף נחיתה לתצוגה מקדימה, שליחה במייל או ייצוא ל-HTML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={selectedPageId} onValueChange={handlePageSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחרי דף נחיתה..." />
                </SelectTrigger>
                <SelectContent>
                  {landingPages.map(page => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPage && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={() => window.open(selectedPage.publicPath, '_blank')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    צפיה בדף הציבורי
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">תצוגה מקדימה של המייל</h3>
                  <div className="border rounded-lg p-2 bg-gray-50">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-96 border rounded"
                      title="תצוגה מקדימה של המייל"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPage && (
          <LandingPageEmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            generateHtml={selectedPage.generateHtml}
            defaultSubject={selectedPage.defaultEmailSubject}
            pageId={selectedPage.id}
            pageName={selectedPage.name}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default LandingPagesManagement;