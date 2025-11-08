import { format } from "date-fns";
import { CheckCircle, ThumbsUp, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ReviewMedia {
  url: string;
  type: 'image' | 'video';
  order: number;
}

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  review_text?: string | null;
  reviewer_name?: string | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  media?: ReviewMedia[] | null;
  profiles?: {
    full_name: string;
  };
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = review.reviewer_name || review.profiles?.full_name || "Anonymous User";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
              {review.verified_purchase && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified Purchase
                </Badge>
              )}
            </div>

            <StarRating rating={review.rating} size="sm" />

            {review.title && (
              <h4 className="font-semibold">{review.title}</h4>
            )}

            {review.review_text && (
              <p className="text-sm text-foreground/80">{review.review_text}</p>
            )}

            {review.media && review.media.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                {review.media.slice(0, 4).map((item, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <button className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={`Review media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <PlayCircle className="h-8 w-8 text-foreground/60" />
                          </div>
                        )}
                        {index === 3 && review.media && review.media.length > 4 && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <span className="text-lg font-semibold">
                              +{review.media.length - 4}
                            </span>
                          </div>
                        )}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`Review media ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-auto rounded-lg"
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}

            {review.helpful_count > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
                <ThumbsUp className="w-4 h-4" />
                <span>{review.helpful_count} people found this helpful</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
