import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Download, Trash2, Upload, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  category: string;
  file_path: string;
  file_size: number | null;
  description: string | null;
  created_at: string;
}

interface DocumentsTabProps {
  patientId: string;
}

export function DocumentsTab({ patientId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    category: 'general',
    description: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const doc of documents) {
        if (doc.document_type.startsWith('image/')) {
          const url = await getDocumentUrl(doc.file_path);
          urls[doc.id] = url;
        }
      }
      
      setDocumentUrls(urls);
    };

    if (documents.length > 0) {
      fetchSignedUrls();
    }
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      logger.error('Error creating signed URL:', error);
      return '';
    }
    return data.signedUrl;
  };

  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          uploaded_by: user.id,
          document_name: selectedFile.name,
          document_type: selectedFile.type,
          category: formData.category,
          file_path: fileName,
          file_size: selectedFile.size,
          description: formData.description || null,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      setIsDialogOpen(false);
      setSelectedFile(null);
      setFormData({
        category: 'general',
        description: '',
      });
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.document_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading && documents.length === 0) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              {doc.document_type.startsWith('image/') && (
                <div 
                  className="relative w-full h-32 rounded-md overflow-hidden bg-muted mb-3 cursor-pointer group"
                  onClick={() => handleViewDocument(doc)}
                >
                  {documentUrls[doc.id] ? (
                    <img 
                      src={documentUrls[doc.id]} 
                      alt={doc.document_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {!doc.document_type.startsWith('image/') && (
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{doc.category}</p>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>{format(new Date(doc.created_at), 'PP')}</span>
              </div>

              <div className="flex gap-2">
                {doc.document_type.startsWith('image/') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocument(doc)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc)}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                required
                className="cursor-pointer"
                accept="image/*,application/pdf,.doc,.docx"
              />
              {selectedFile && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{selectedFile.name}</span>
                    <span>({formatFileSize(selectedFile.size)})</span>
                  </div>
                  {selectedFile.type.startsWith('image/') && (
                    <div className="relative w-full h-48 rounded-md border overflow-hidden bg-muted">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="lab-results">Lab Results</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="consent">Consent Form</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.document_name}</DialogTitle>
          </DialogHeader>
          {viewingDocument?.document_type.startsWith('image/') && (
            <div className="relative w-full max-h-[70vh] rounded-md overflow-hidden bg-muted">
              <img 
                src={documentUrls[viewingDocument.id] || ''} 
                alt={viewingDocument.document_name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => viewingDocument && handleDownload(viewingDocument)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={() => setViewingDocument(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
