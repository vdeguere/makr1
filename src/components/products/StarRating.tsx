import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  showCount = false,
  reviewCount = 0,
  className 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      if (rating >= i) {
        // Full star
        stars.push(
          <Star
            key={i}
            className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
          />
        );
      } else if (rating >= i - 0.5) {
        // Half star
        stars.push(
          <StarHalf
            key={i}
            className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
          />
        );
      } else {
        // Empty star
        stars.push(
          <Star
            key={i}
            className={cn(sizeClasses[size], "text-muted-foreground")}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showCount && reviewCount > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
