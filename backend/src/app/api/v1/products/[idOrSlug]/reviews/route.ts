import { withRouteHandler } from '@/shared/middleware/compose';
import { authenticate } from '@/shared/middleware/authenticate';
import { enforceRateLimit } from '@/shared/middleware/rate-limit';
import { jsonResource } from '@/shared/http/response';
import { createReviewSchema, listProductReviewsQuerySchema } from '@/modules/reviews/schemas';
import * as reviewsService from '@/modules/reviews/service';
import * as productsService from '@/modules/products/service';

/** Public — anyone can read a Product's reviews, no authentication required. */
export const GET = withRouteHandler(async ({ request, correlationId, params }) => {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimit = await enforceRateLimit('public', ip);

  const product = await productsService.getPublicProductDetail(params.idOrSlug as string);

  const { searchParams } = new URL(request.url);
  const query = listProductReviewsQuerySchema.parse(Object.fromEntries(searchParams));
  const reviews = await reviewsService.listProductReviews(product.id, query);

  return jsonResource({ data: reviews }, { correlationId, rateLimit });
});

export const POST = withRouteHandler(async ({ request, correlationId, params }) => {
  const auth = await authenticate(request);
  const rateLimit = await enforceRateLimit('standard', auth.userId);

  const product = await productsService.getPublicProductDetail(params.idOrSlug as string);

  const body = createReviewSchema.parse({ ...(await request.json()), productId: product.id });
  const review = await reviewsService.createReview(auth.userId, body);

  return jsonResource(review, { correlationId, rateLimit }, 201);
});
