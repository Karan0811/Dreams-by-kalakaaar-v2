"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, Trash2 } from "lucide-react";
import { useSession } from "@dbk/auth";
import {
  useProductReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@dbk/api-client";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, FormField, Skeleton, Textarea, toast } from "@dbk/ui";

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1, "Please write a review").max(5000),
});
type ReviewFormInput = z.infer<typeof reviewFormSchema>;

function StarRatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className="size-6"
            fill={star <= value ? "var(--color-brand-accent)" : "none"}
            stroke="var(--color-brand-accent)"
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const { data: session } = useSession();
  const { data: reviews, isLoading, isError, refetch } = useProductReviews(productSlug);
  const createReview = useCreateReview(productSlug);
  const updateReview = useUpdateReview(productSlug);
  const deleteReview = useDeleteReview(productSlug);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInput>({ resolver: zodResolver(reviewFormSchema), defaultValues: { rating: 0 } });

  const myReview = reviews?.find((r) => r.userId === session?.user?.id) ?? null;

  async function onSubmit(values: ReviewFormInput) {
    try {
      if (editingId) {
        await updateReview.mutateAsync({ reviewId: editingId, ...values });
        toast.success("Review updated");
        setEditingId(null);
      } else {
        await createReview.mutateAsync(values);
        toast.success("Thanks for your review!");
      }
      reset({ rating: 0, title: "", body: "" });
    } catch {
      toast.error("Couldn't save your review. Please try again.");
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    try {
      await deleteReview.mutateAsync(pendingDeleteId);
      toast.success("Review deleted");
    } catch {
      toast.error("Couldn't delete this review. Please try again.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="border-t border-border pt-[var(--space-400)]">
      <h2 className="font-serif text-[20px] text-text-primary">Reviews</h2>

      {session && !myReview ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-[var(--space-300)] flex flex-col gap-[var(--space-150)]">
          <FormField id="rating" label="Your rating" error={errors.rating?.message} required>
            <StarRatingInput value={watch("rating")} onChange={(v) => setValue("rating", v, { shouldValidate: true })} />
          </FormField>
          <FormField id="body" label="Your review" error={errors.body?.message} required>
            <Textarea rows={3} {...register("body")} />
          </FormField>
          <Button type="submit" className="self-start" isLoading={isSubmitting}>
            Submit Review
          </Button>
        </form>
      ) : null}

      <div className="mt-[var(--space-400)]">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState description="We couldn't load reviews." onRetry={() => refetch()} />
        ) : !reviews || reviews.length === 0 ? (
          <EmptyState title="No reviews yet" description="Be the first to share your thoughts on this piece." />
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="size-3.5"
                            fill={i < review.rating ? "var(--color-brand-accent)" : "none"}
                            stroke="var(--color-brand-accent)"
                          />
                        ))}
                        {review.isVerifiedPurchase ? <Badge variant="success">Verified Purchase</Badge> : null}
                      </div>
                      <p className="mt-1 text-[14px] font-medium text-text-primary">
                        {review.title || review.authorDisplayName}
                      </p>
                      <p className="mt-0.5 text-[13px] text-text-secondary">{review.body}</p>
                      <p className="mt-1 text-[12px] text-text-secondary">
                        {review.authorDisplayName} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                    </div>
                    {session?.user?.id === review.userId ? (
                      <Button
                        variant="tertiary"
                        size="sm"
                        aria-label="Delete review"
                        onClick={() => setPendingDeleteId(review.id)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete your review?"
        description="This can't be undone."
        destructive
        isConfirming={deleteReview.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
