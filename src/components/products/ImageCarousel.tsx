import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImage {
  url: string;
  caption?: string | null;
}

interface ImageCarouselProps {
  images: ProductImage[];
  productName: string;
}

export function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        <img
          src={currentImage.url}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Caption */}
        {currentImage.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-sm">{currentImage.caption}</p>
          </div>
        )}
      </div>

      {/* Thumbnail Gallery - Only show if more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
