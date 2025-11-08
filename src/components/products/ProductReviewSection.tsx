import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductReviewSectionProps {
  herbId: string;
  averageRating?: number;
  reviewCount?: number;
  userRole?: string;
}

export function ProductReviewSection({ 
  herbId, 
  averageRating = 0, 
  reviewCount = 0,
  userRole 
}: ProductReviewSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchReviews();
    if (userRole === 'patient') {
      checkCanReview();
    } else if (userRole === 'admin' || userRole === 'practitioner') {
      checkExistingReview();
    }
  }, [herbId, sortBy, userRole]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("product_reviews")
        .select(`
          *,
          profiles:user_id (full_name),
          reviewer_name
        `)
        .eq("herb_id", herbId);

      // Apply sorting
      if (sortBy === "recent") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "highest") {
        query = query.order("rating", { ascending: false });
      } else if (sortBy === "lowest") {
        query = query.order("rating", { ascending: true });
      } else if (sortBy === "helpful") {
        query = query.order("helpful_count", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get patient record
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!patient) return;

      setPatientId(patient.id);

      // Check if user has received this product
      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          recommendation_id,
          recommendations!inner (
            patient_id,
            recommendation_items!inner (
              herb_id
            )
          )
        `)
        .eq("recommendations.patient_id", patient.id)
        .eq("status", "delivered");

      const hasReceived = orders?.some((order: any) =>
        order.recommendations.recommendation_items.some((item: any) => item.herb_id === herbId)
      );

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("herb_id", herbId)
        .eq("patient_id", patient.id)
        .maybeSingle();

      setCanReview(hasReceived && !existingReview);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  };

  const checkExistingReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already reviewed this herb
      const { data: existingReview } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("herb_id", herbId)
        .eq("user_id", user.id)
        .maybeSingle();

      setCanReview(!existingReview);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    setCanReview(false);
    fetchReviews();
  };

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      dist[review.rating as keyof typeof dist]++;
    });
    return dist;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-start gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </div>
              <StarRating rating={averageRating} size="lg" className="justify-center mb-2" />
              <p className="text-sm text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            {reviewCount > 0 && (
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-8">{star} ★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${reviewCount > 0 ? (distribution[star as keyof typeof distribution] / reviewCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {distribution[star as keyof typeof distribution]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write Review Button */}
          {userRole === 'patient' && canReview && !showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full">
              Write a Review
            </Button>
          )}

          {(userRole === 'admin' || userRole === 'practitioner') && canReview && !showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full">
              Write a Professional Review
            </Button>
          )}

          {userRole === 'patient' && !canReview && !showForm && patientId && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can write a review after receiving this product through a practitioner recommendation.
              </AlertDescription>
            </Alert>
          )}

          {/* Review Form */}
          {showForm && (userRole === 'patient' ? patientId : true) && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Write Your Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  herbId={herbId}
                  patientId={userRole === 'patient' ? patientId : null}
                  userRole={userRole}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Sort Controls */}
      {reviewCount > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
          </h3>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
