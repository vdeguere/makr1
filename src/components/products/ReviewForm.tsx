import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reviewSchema, type ReviewFormData } from "@/lib/validations/review";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReviewMediaUpload } from "./ReviewMediaUpload";
import { logger } from "@/lib/logger";

interface ReviewFormProps {
  herbId: string;
  patientId?: string | null;
  userRole?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ herbId, patientId, userRole, onSuccess, onCancel }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      herb_id: herbId,
      patient_id: patientId || null,
      rating: 0,
      title: "",
      review_text: "",
      reviewer_name: "",
      media: [],
    },
  });

  const rating = form.watch("rating");

  const onSubmit = async (data: ReviewFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("product_reviews").insert({
        herb_id: data.herb_id,
        patient_id: data.patient_id || null,
        user_id: user.id,
        rating: data.rating,
        title: data.title || null,
        review_text: data.review_text || null,
        reviewer_name: data.reviewer_name || null,
        verified_purchase: !!data.patient_id,
        media: (data.media && data.media.length > 0 ? data.media : null) as any,
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      logger.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating *</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {userRole === 'admin' && (
          <FormField
            control={form.control}
            name="reviewer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reviewer Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter reviewer's name"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Leave blank to use your profile name
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Sum up your experience in one line"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="review_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience with this product..."
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="media"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ReviewMediaUpload
                  media={(field.value || []) as Array<{ url: string; type: 'image' | 'video'; order: number }>}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
