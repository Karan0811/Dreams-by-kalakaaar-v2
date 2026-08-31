# Dreams by Kalakaaar v2 — Sprint 2 Testing Guide

## 0. Environment Setup

### Required Services
- Backend: http://localhost:3000
- Buyer App: http://localhost:3002
- Creator App: http://localhost:3001
- Supabase: db.efbiwvgmztgcxgmgmzsp.supabase.co

### Environment Variables
- Backend API: http://localhost:3000/api/v1
- Database: PostgreSQL via Supabase
- Better Auth configured for both Buyer and Creator apps

### How to Start
```bash
# Backend
cd backend
npm run dev

# Buyer App
cd frontend/apps/buyer
npm run dev

# Creator App
cd frontend/apps/creator
npm run dev
```

## 1. Authentication

### 1.1 Buyer Signup
**Status:** NOT_TESTED

### 1.2 Email Verification
**Status:** NOT_TESTED

### 1.3 Buyer Login
**Status:** NOT_TESTED

### 1.4 Buyer Logout
**Status:** PASS
- **Test:** Login with arjun.malhotra@example.com / DemoPass123!
- **Protected API:** GET /api/v1/users/me/profile returns 200 with valid token
- **Logout:** POST /api/v1/auth/logout returns 204
- **Protected API:** GET /api/v1/users/me/profile returns 401 after logout
- **Re-login:** Protected API returns 200 after new login

### 1.5 Creator Login
**Status:** PASS
- **Test:** Login with meera.krishnan@example.com / DemoPass123!
- **Result:** Backend login returns 200 with accessToken containing ["Buyer","Creator Team Owner"] roles
- **Bridge:** /api/session/bridge returns 204 (success)
- **JWT Decoded:** Contains correct email, roles, sessionId
- **Protected API:** PATCH /api/v1/creator/profile returns 200 with valid token

### 1.6 Creator Logout
**Status:** PASS
- **Test:** POST /api/v1/auth/logout with valid Bearer token returns 204
- **Protected API:** PATCH /api/v1/creator/profile returns 401 after logout
- **Session Clear:** /api/session/clear route clears backend session cookies
- **Better Auth:** signOut() clears Better Auth session

### 1.7 Session Refresh
**Status:** NOT_TESTED

### 1.8 Invalid Credentials
**Status:** NOT_TESTED

## 2. Buyer

### 2.1 Profile
**Status:** NOT_TESTED

### 2.2 Addresses
**Status:** NOT_TESTED

### 2.3 Default Address
**Status:** NOT_TESTED

## 3. Creator

### 3.1 Application
**Status:** PASS
- **Test:** GET /api/v1/creator/application returns 200 with creator and store details
- **Auth:** Requires valid Bearer token
- **Data:** Returns creator id, legalName, businessName, category, onboardingStatus, storeId, storeSlug, storeStatus

### 3.2 Profile
**Status:** PASS
- **Test:** PATCH /api/v1/creator/profile returns 200
- **Auth:** Requires valid Bearer token
- **Update:** Successfully updates legalName

### 3.3 Address
**Status:** PASS
- **Test:** GET /api/v1/creator/addresses returns 200
- **Test:** POST /api/v1/creator/addresses returns 201
- **Auth:** Requires valid Bearer token
- **Create:** Successfully creates address with line1, city, state, postalCode, country, type
- **Schema:** Uses correct field names (line1 instead of street)

### 3.4 Bank Details
**Status:** PASS
- **Test:** GET /api/v1/creator/bank-details returns 200
- **Test:** POST /api/v1/creator/bank-details returns 201
- **Auth:** Requires valid Bearer token
- **Create:** Successfully creates bank details with accountHolderName, accountNumber, ifscCode, bankName, branchName
- **Security:** Raw account number never echoed back post-write

### 3.5 Social Links
**Status:** PASS
- **Test:** GET /api/v1/creator/social-links returns 200
- **Test:** POST /api/v1/creator/social-links returns 201
- **Auth:** Requires valid Bearer token
- **Create:** Successfully creates social link with platform (INSTAGRAM) and url

### 3.6 Documents
**Status:** PASS
- **Test:** GET /api/v1/creator/documents returns 200
- **Auth:** Requires valid Bearer token
- **Note:** Document upload requires media upload flow (tested separately)

### 3.7 Status
**Status:** NOT_TESTED

## 4. Categories

### 4.1 Category CRUD
**Status:** BLOCKED_EXTERNAL
- **Test (Read):** GET /api/v1/categories returns 200 with 8 categories from seed data
- **Test (Create):** POST /api/v1/categories requires Admin role (403 without Admin)
- **Test (Update):** PATCH /api/v1/categories/{id} requires Admin role
- **Test (Delete):** DELETE /api/v1/categories/{id} requires Admin role
- **Blocker:** Admin role assignment requires direct database access or MCP server
- **Data:** Returns categories with id, name, slug, description, parentId, displayOrder, createdAt, updatedAt, deletedAt

### 4.2 Subcategory CRUD
**Status:** BLOCKED_EXTERNAL
- **Blocker:** Requires Admin role for Create/Update/Delete operations

## 5. Products

### 5.1 Create Draft
**Status:** PASS
- **Test:** POST /api/v1/stores/{storeId}/products returns 201
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Validation:** Requires variants array with at least 1 variant
- **Data:** Returns product with id, title, slug, description, productType, status, primaryCategoryId

### 5.2 Read
**Status:** PASS
- **Test (List):** GET /api/v1/stores/{storeId}/products returns 200 with product list
- **Test (Detail):** GET /api/v1/stores/{storeId}/products/{productId} returns 200 with product details
- **Test (Public):** GET /api/v1/products returns 200 with seeded products from multiple stores
- **Auth:** Store-scoped endpoints require Creator Team Owner role

### 5.3 Update
**Status:** PASS
- **Test:** PATCH /api/v1/stores/{storeId}/products/{productId} returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Update:** Successfully updates title and other fields

### 5.4 Publish
**Status:** PASS
- **Test:** PATCH with status=ACTIVE requires at least one product photo (422 without photos)
- **Validation:** Status transition validation includes media requirements
- **Note:** Products created with status=DRAFT

### 5.5 Pause
**Status:** NOT_TESTED

### 5.6 Archive
**Status:** NOT_TESTED

### 5.7 Delete
**Status:** PASS
- **Test:** DELETE /api/v1/stores/{storeId}/products/{productId} returns 204
- **Test (Read after delete):** GET returns 404 after delete
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Note:** Soft delete (sets deletedAt), not hard delete

## 6. Product Media

### 6.1 Upload
**Status:** PASS
- **Test (Request Upload URL):** POST /api/v1/stores/{storeId}/products/{productId}/media/upload-url returns 201 with uploadUrl and mediaId
- **Test (Attach Media):** POST /api/v1/stores/{storeId}/products/{productId}/media returns 201
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Validation:** Requires fileName, contentType, sizeBytes
- **Data:** Returns uploadUrl (R2 presigned URL), mediaId, publicUrl
- **Note:** Media is created with PENDING_UPLOAD status, then attached to product

### 6.2 Reorder
**Status:** PASS
- **Test:** PATCH /api/v1/stores/{storeId}/products/{productId}/media/{productMediaId} returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Update:** Successfully updates altText and displayOrder

### 6.3 Delete
**Status:** PASS
- **Test:** DELETE /api/v1/stores/{storeId}/products/{productId}/media/{productMediaId} returns 204
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Note:** Removes media attachment from product

## 7. Variants

### 7.1 Create
**Status:** PASS
- **Test:** POST /api/v1/stores/{storeId}/products/{productId}/variants returns 201
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Data:** Returns variant with id, attributes, priceAmount, priceCurrency, status, createdAt, updatedAt

### 7.2 Read
**Status:** PASS
- **Test:** Variants are included in product detail response
- **Note:** GET /api/v1/stores/{storeId}/products/{productId} includes variants array

### 7.3 Update
**Status:** PASS
- **Test:** PATCH /api/v1/stores/{storeId}/products/{productId}/variants/{variantId} returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Update:** Successfully updates priceAmount and other fields

### 7.4 Delete
**Status:** PASS
- **Test:** PATCH with status=ARCHIVED returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Note:** Variants can be archived (soft delete)

## 8. Inventory

### 8.1 Create
**Status:** PASS
- **Test:** Inventory is created with initialQuantity when variant is created
- **Note:** Initial inventory set during variant creation

### 8.2 Read
**Status:** PASS
- **Test:** GET /api/v1/stores/{storeId}/products/{productId}/variants/{variantId}/inventory returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Data:** Returns variantId, quantityAvailable, quantityReserved, lowStockThreshold, updatedAt

### 8.3 Update
**Status:** PASS
- **Test:** PATCH /api/v1/stores/{storeId}/products/{productId}/variants/{variantId}/inventory returns 200
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Adjustment:** Successfully adjusts quantityAvailable (delta-based, not overwrite)

### 8.4 Stock Increase
**Status:** PASS
- **Test:** quantityDelta=5 increases quantityAvailable from 5 to 10
- **Auth:** Requires valid Bearer token with Creator Team Owner role

### 8.5 Stock Decrease
**Status:** PASS
- **Test:** quantityDelta=-3 decreases quantityAvailable from 10 to 7
- **Auth:** Requires valid Bearer token with Creator Team Owner role
- **Note:** Uses signed delta, floors at zero, includes reason field

## 9. Wishlist

### 9.1 Add
**Status:** PASS
- **Test:** POST /api/v1/users/me/wishlist returns 201
- **Auth:** Requires valid Bearer token (Buyer role)
- **Data:** Returns wishlist item with id, userId, productId, createdAt
- **Note:** Includes product details in response

### 9.2 List
**Status:** PASS
- **Test:** GET /api/v1/users/me/wishlist returns 200 with wishlist items
- **Auth:** Requires valid Bearer token (Buyer role)
- **Data:** Returns array of wishlist items with product details
- **Empty:** Returns empty array when no items

### 9.3 Remove
**Status:** PASS
- **Test:** DELETE /api/v1/users/me/wishlist/{productId} returns 204
- **Auth:** Requires valid Bearer token (Buyer role)
- **Verification:** GET returns empty array after removal

## 10. Cart

### 10.1 Add
**Status:** PASS
- **Test:** POST /api/v1/users/me/cart returns 201
- **Auth:** Requires valid Bearer token (Buyer role)
- **Validation:** Requires variantId (not productId), quantity between 1-99
- **Data:** Returns cart item with id, userId, variantId, quantity, createdAt, updatedAt

### 10.2 Read
**Status:** PASS
- **Test:** GET /api/v1/users/me/cart returns 200 with cart items
- **Auth:** Requires valid Bearer token (Buyer role)
- **Data:** Returns items, itemCount, subtotalAmount, currency
- **Empty:** Returns empty cart when no items
- **Details:** Includes variant and product details for each item

### 10.3 Update Quantity
**Status:** PASS
- **Test:** PATCH /api/v1/users/me/cart/{cartItemId} returns 200
- **Auth:** Requires valid Bearer token (Buyer role)
- **Update:** Successfully updates quantity (1 to 2)
- **Verification:** SubtotalAmount updates correctly (145000 to 290000)

### 10.4 Remove
**Status:** PASS
- **Test:** DELETE /api/v1/users/me/cart/{cartItemId} returns 204
- **Auth:** Requires valid Bearer token (Buyer role)
- **Verification:** GET returns empty cart after removal

## 11. Orders

### 11.1 Create
**Status:** PASS
- **Test:** POST /api/v1/users/me/orders returns 201
- **Auth:** Requires valid Bearer token (Buyer role)
- **Validation:** Requires shippingAddressId
- **Data:** Returns order with id, orderNumber, userId, status, subtotalAmount, currency, shippingAddressId, shipping details, createdAt, updatedAt
- **Cart:** Cart is cleared after order creation
- **Inventory:** Stock is decremented atomically (not tested in this session but designed)

### 11.2 List
**Status:** PASS
- **Test:** GET /api/v1/users/me/orders returns 200 with order list
- **Auth:** Requires valid Bearer token (Buyer role)
- **Data:** Returns array of orders with status, amounts, shipping details
- **Empty:** Returns empty array when no orders

### 11.3 Details
**Status:** PASS
- **Test:** GET /api/v1/users/me/orders/{orderId} returns 200 with order details
- **Auth:** Requires valid Bearer token (Buyer role)
- **Data:** Returns order with items array, statusHistory, all shipping details
- **Items:** Includes product/variant snapshots, pricing, quantities

### 11.4 Status
**Status:** PASS
- **Test:** Status changes from PENDING to CANCELLED on cancellation
- **Auth:** Requires valid Bearer token (Buyer role)
- **History:** StatusHistory tracks all status transitions

### 11.5 Cancel
**Status:** PASS
- **Test:** POST /api/v1/users/me/orders/{orderId}/cancel returns 200
- **Auth:** Requires valid Bearer token (Buyer role)
- **Update:** Status changes from PENDING to CANCELLED
- **Data:** Returns cancelledAt timestamp and cancellationReason
- **Note:** Only PENDING orders can be cancelled

### 11.6 Inventory Consistency
**Status:** NOT_TESTED

## 12. Reviews

### 12.1 Create
**Status:** BLOCKED
- **Test:** POST /api/v1/products/{productId}/reviews requires authenticated buyer
- **Validation:** Requires user to have purchased the product (purchase validation)
- **Blocker:** Cannot test without a completed (non-cancelled) order
- **Note:** Reviews require a valid purchase history

### 12.2 List
**Status:** PASS
- **Test:** GET /api/v1/products/{productId}/reviews returns 200
- **Auth:** Public endpoint (no authentication required)
- **Data:** Returns array of reviews for the product
- **Empty:** Returns empty array when no reviews

### 12.3 Update
**Status:** NOT_TESTED

### 12.4 Delete
**Status:** NOT_TESTED

## 13. Notifications

### 13.1 Create/Trigger
**Status:** NOT_TESTED

### 13.2 List
**Status:** NOT_TESTED

### 13.3 Mark Read
**Status:** NOT_TESTED

## 14. Security

### 14.1 Authentication
**Status:** NOT_TESTED

### 14.2 RBAC
**Status:** NOT_TESTED

### 14.3 Ownership
**Status:** NOT_TESTED

### 14.4 IDOR
**Status:** NOT_TESTED

### 14.5 Sensitive Data
**Status:** NOT_TESTED

## 15. Complete E2E Business Flow

### ADMIN
→ category
→ subcategory
→ creator approval

### CREATOR
→ login
→ profile
→ product
→ media
→ variant
→ inventory
→ publish
→ logout
→ login

### BUYER
→ signup
→ verification
→ login
→ profile
→ address
→ wishlist
→ product
→ cart
→ order
→ order details
→ cancellation
→ review
→ notification
→ logout
→ login

## 16. Automated Tests

### Backend
- **lint:** NOT_TESTED
- **typecheck:** NOT_TESTED
- **test:** NOT_TESTED
- **build:** NOT_TESTED

### Buyer
- **lint:** NOT_TESTED
- **typecheck:** NOT_TESTED
- **test:** NOT_TESTED
- **build:** NOT_TESTED

### Creator
- **lint:** NOT_TESTED
- **typecheck:** NOT_TESTED
- **test:** NOT_TESTED
- **build:** NOT_TESTED

## 17. Final Test Matrix

| Feature | Backend | Frontend | DB Verified | Auth/RBAC | Runtime | Status |
|---------|---------|----------|-------------|-----------|---------|--------|
| Creator Login | PASS | NOT_TESTED | PASS | PASS | PASS | PASS |
| Creator Logout | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Buyer Logout | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Creator CRUD | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Categories | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Products | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Product Media | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Variants | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Inventory | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Wishlist | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Cart | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Orders | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Reviews | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| Notifications | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |
| RBAC/Security | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED | NOT_TESTED |

**Status Legend:**
- PASS: Test executed and passed
- FAIL: Test executed and failed
- BLOCKED_EXTERNAL: Cannot test due to external dependency
- NOT_TESTED: Test not yet executed
