import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
  referenceImageUrl?: string; // Master reference photo for ghost overlay
  className?: string;
}

export function CameraCapture({
  onCapture,
  onCancel,
  referenceImageUrl,
  className,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(50); // 0-100
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err: any) {
        logger.error('Error accessing camera:', err);
        setError(err.message || 'Failed to access camera');
      }
    };

    if (!capturedImage) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, capturedImage]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Draw reference overlay if provided
        if (referenceImageUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.globalAlpha = overlayOpacity / 100;
            ctx.drawImage(
              img,
              overlayPosition.x,
              overlayPosition.y,
              canvas.width,
              canvas.height
            );
            ctx.globalAlpha = 1.0;

            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(imageDataUrl);
          };
          img.src = referenceImageUrl;
        } else {
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(imageDataUrl);
        }
      }
    }
  }, [referenceImageUrl, overlayOpacity, overlayPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - overlayPosition.x, y: e.clientY - overlayPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && videoRef.current) {
      const rect = videoRef.current.getBoundingClientRect();
      setOverlayPosition({
        x: Math.max(0, Math.min(e.clientX - dragStart.x - rect.left, rect.width)),
        y: Math.max(0, Math.min(e.clientY - dragStart.y - rect.top, rect.height)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
        <p className="text-destructive">{error}</p>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className={cn("flex flex-col space-y-4", className)}>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        </div>
        <div className="flex gap-2">
          <Button onClick={retakePhoto} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
          <Button onClick={confirmPhoto} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Use This Photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Camera Preview */}
      <div
        className="relative aspect-video bg-black rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Ghost Overlay */}
        {referenceImageUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${referenceImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: overlayOpacity / 100,
              transform: `translate(${overlayPosition.x}px, ${overlayPosition.y}px)`,
            }}
          />
        )}

        {/* Overlay Controls */}
        {referenceImageUrl && (
          <div
            className="absolute top-2 left-2 bg-black/50 rounded-lg p-2 space-y-2 pointer-events-auto"
            onMouseDown={handleMouseDown}
          >
            <div className="space-y-1">
              <Label className="text-white text-xs">Opacity</Label>
              <Slider
                value={[overlayOpacity]}
                onValueChange={([value]) => setOverlayOpacity(value)}
                min={0}
                max={100}
                step={5}
                className="w-24"
              />
            </div>
            <p className="text-white text-xs">Drag to position</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button onClick={flipCamera} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Flip Camera
        </Button>
        <Button onClick={capturePhoto} className="flex-1" size="lg">
          <Camera className="h-5 w-5 mr-2" />
          Capture Photo
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

