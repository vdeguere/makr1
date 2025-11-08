import { useState } from "react";
import { X, Upload, Star, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProductImage {
  url: string;
  isPrimary: boolean;
  order: number;
  caption?: string | null;
}

interface ImageUploadManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  onUpload: (files: FileList) => Promise<void>;
  maxImages?: number;
  uploadingImages?: boolean;
}

export function ImageUploadManager({
  images,
  onChange,
  onUpload,
  maxImages = 10,
  uploadingImages = false,
}: ImageUploadManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onUpload(files);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onChange(updatedImages);
  };

  const handleSetPrimary = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updatedImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updatedImages = images.map((img, i) =>
      i === index ? { ...img, caption: caption || null } : img
    );
    onChange(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedImages = [...images];
    const draggedImage = updatedImages[draggedIndex];
    updatedImages.splice(draggedIndex, 1);
    updatedImages.splice(index, 0, draggedImage);

    // Update order
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      order: i,
    }));

    onChange(reorderedImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <Label>Product Images (Max {maxImages})</Label>
        <div className="mt-2">
          <Input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            disabled={!canAddMore || uploadingImages}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("image-upload")?.click()}
            disabled={!canAddMore || uploadingImages}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadingImages
              ? "Uploading..."
              : canAddMore
              ? `Upload Images (${images.length}/${maxImages})`
              : `Maximum ${maxImages} images reached`}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Recommended: 1200x1200px, max 5MB per image
        </p>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative border rounded-lg p-3 space-y-2 cursor-move hover:shadow-md transition-shadow",
                image.isPrimary && "border-primary bg-primary/5"
              )}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
                  Primary
                </div>
              )}

              {/* Image Preview */}
              <div className="relative aspect-square rounded overflow-hidden bg-muted">
                <img
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={image.isPrimary ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetPrimary(index)}
                  className="flex-1"
                >
                  <Star
                    className={cn(
                      "h-3 w-3 mr-1",
                      image.isPrimary && "fill-current"
                    )}
                  />
                  {image.isPrimary ? "Primary" : "Set Primary"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Caption Input */}
              <div>
                <Label htmlFor={`caption-${index}`} className="text-xs">
                  Caption (optional)
                </Label>
                <Input
                  id={`caption-${index}`}
                  type="text"
                  placeholder="Add image caption..."
                  value={image.caption || ""}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  maxLength={200}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
