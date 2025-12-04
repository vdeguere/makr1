import { useState } from "react";
import { X, Upload, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  order: number;
}

interface ReviewMediaUploadProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxMedia?: number;
}

export function ReviewMediaUpload({
  media,
  onChange,
  maxMedia = 5,
}: ReviewMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length + files.length > maxMedia) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxMedia} images/videos`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedMedia: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `review-${timestamp}-${i}-${file.name}`;
        const filePath = `reviews/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(data.path);

        uploadedMedia.push({
          url: publicUrl,
          type: fileType,
          order: media.length + uploadedMedia.length,
        });
      }

      onChange([...media, ...uploadedMedia]);
      toast({
        title: "Media uploaded",
        description: `${uploadedMedia.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      logger.error("Error uploading media:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updatedMedia = media
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    onChange(updatedMedia);
  };

  const canAddMore = media.length < maxMedia;

  return (
    <div className="space-y-4">
      <div>
        <Label>Photos & Videos (Optional)</Label>
        <div className="mt-2">
          <Input
            id="media-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            onChange={handleFileSelect}
            disabled={!canAddMore || uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("media-upload")?.click()}
            disabled={!canAddMore || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading
              ? "Uploading..."
              : canAddMore
              ? `Add Media (${media.length}/${maxMedia})`
              : `Maximum ${maxMedia} files reached`}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Share photos or videos of the product. Max 10MB per file.
        </p>
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted border"
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Review media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-1 right-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveMedia(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="absolute bottom-1 left-1">
                <div className="bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                  {item.type === 'image' ? (
                    <Image className="h-3 w-3" />
                  ) : (
                    <Video className="h-3 w-3" />
                  )}
                  {item.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
