import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Slider } from './slider';
import { Label } from './label';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1, // Default to square (1:1)
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset crop when image changes
  useEffect(() => {
    if (open && imageSrc) {
      setCrop({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5,
      });
      setScale(1);
    }
  }, [open, imageSrc]);

  const getCroppedImage = async (): Promise<Blob> => {
    const image = imgRef.current;
    const cropArea = completedCrop;

    if (!image || !cropArea) {
      throw new Error('No crop area selected');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to desired output size (300x300 for avatars)
    const outputSize = 300;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate source dimensions with scaling
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Draw the cropped image on the canvas
    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9 // High quality JPEG
      );
    });
  };

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    try {
      setProcessing(true);
      const croppedBlob = await getCroppedImage();
      onCropComplete(croppedBlob);
      onOpenChange(false);
    } catch (error) {
      logger.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
          <DialogDescription>
            Adjust the crop area and zoom to frame your profile picture perfectly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Zoom Control */}
          <div className="space-y-2">
            <Label>Zoom: {Math.round(scale * 100)}%</Label>
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Crop Area */}
          <div className="flex justify-center bg-muted rounded-lg p-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                style={{
                  transform: `scale(${scale})`,
                  maxWidth: '100%',
                  maxHeight: '500px',
                }}
                className="rounded-lg"
              />
            </ReactCrop>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            The cropped image will be resized to 300x300 pixels for optimal avatar display
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!completedCrop || processing}
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
