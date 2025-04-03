# API Documentation

This document outlines the available API endpoints for the Coffee Craft Service.

**Base URL:** (Assuming running locally) `http://localhost:3001`

**Authentication:** Most modification endpoints and user-specific data endpoints require authentication. This is typically handled by sending a JWT token (obtained via `/auth/login`) in an `Authorization: Bearer <token>` header or via a secure HTTP-only cookie (`access_token`). Ensure your HTTP client is configured to send credentials/cookies if using the cookie method.

**Common Status Codes:**
-   `200 OK`: Request successful. Response body included.
-   `201 Created`: Resource successfully created. Response body included.
-   `204 No Content`: Request successful, no response body needed (e.g., successful DELETE).
-   `400 Bad Request`: Invalid request syntax, validation error, or invalid parameters. Response body usually contains error details.
-   `401 Unauthorized`: Authentication failed or token missing/invalid/expired.
-   `403 Forbidden`: Authenticated user does not have permission to access the resource.
-   `404 Not Found`: Requested resource could not be found.
-   `409 Conflict`: Request conflicts with the current state of the resource (e.g., duplicate entry).
-   `500 Internal Server Error`: An unexpected error occurred on the server.

---

## Authentication (`/auth`)

### Register User
-   **`POST /auth/register`**
    -   **Description:** Registers a new user account.
    -   **Request Body:**
        ```json
        {
          "email": "string (required, unique)",
          "password": "string (required, min 6 chars)",
          "name": "string (optional)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created user object (excluding password).
        ```json
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "role": "CUSTOMER",
          "createdAt": "timestamp",
          "updatedAt": "timestamp",
          // ... other non-sensitive fields like phone, address, imgUrl, gender, dob, isActive, emailVerified, lastLogin
        }
        ```
    -   **Error Responses:** `400 Bad Request` (Validation failed), `409 Conflict` (Email already exists).

### Login User
-   **`POST /auth/login`**
    -   **Description:** Authenticates a user and sets an HTTP-only cookie (`access_token`) containing the JWT.
    -   **Request Body:**
        ```json
        {
          "email": "string (required)",
          "password": "string (required)"
        }
        ```
    -   **Success Response (200 OK):** Returns the authenticated user object (excluding password). Sets `access_token` cookie.
        ```json
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "role": "CUSTOMER",
           // ... other non-sensitive fields
        }
        ```
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized` (Invalid credentials).

### Logout User
-   **`POST /auth/logout`**
    -   **Description:** Clears the `access_token` cookie, effectively logging the user out.
    -   **Success Response (200 OK):**
        ```json
        { "message": "Logged out successfully" }
        ```

### Get Current User Profile
-   **`GET /auth/me`**
    -   **Description:** Retrieves the profile of the user associated with the current valid `access_token`.
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns the authenticated user object (excluding password).
        ```json
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "role": "CUSTOMER",
           // ... other non-sensitive fields
        }
        ```
    -   **Error Responses:** `401 Unauthorized`.

---

## Brands (`/brands`)

### List Brands
-   **`GET /brands`**
    -   **Description:** Retrieves a paginated list of brands.
    -   **Query Parameters:**
        -   `page` (number, optional, default: 1): Page number.
        -   `limit` (number, optional, default: 10): Items per page.
        -   `sortBy` (string, optional, e.g., `name`, `createdAt`): Field to sort by.
        -   `sortOrder` (string, optional, `asc` or `desc`, default: `asc` if `sortBy` is `name`, `desc` otherwise): Sort direction.
    -   **Success Response (200 OK):**
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "name": "Brand Name",
              "description": "Description",
              "order": 1,
              "_count": { "products": 5 },
              "createdAt": "timestamp",
              "updatedAt": "timestamp"
            }
            // ... more brands
          ],
          "total": 25 // Total number of brands matching query
        }
        ```
    -   **Error Responses:** `500 Internal Server Error`.

### Get Brand by ID
-   **`GET /brands/:id`**
    -   **Description:** Retrieves a specific brand by its unique ID.
    -   **Success Response (200 OK):**
        ```json
        {
          "id": "uuid",
          "name": "Brand Name",
          "description": "Description",
          "order": 1,
          "_count": { "products": 5 },
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
        ```
    -   **Error Responses:** `404 Not Found`, `500 Internal Server Error`.

### Create Brand
-   **`POST /brands`**
    -   **Description:** Creates a new brand.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:**
        ```json
        {
          "name": "string (required)",
          "description": "string (optional)",
          "order": "number (optional)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created brand object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (Duplicate name), `500 Internal Server Error`.

### Update Brand
-   **`PUT /brands/:id`**
    -   **Description:** Updates an existing brand.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:** Provide fields to update.
        ```json
        {
          "name": "string (optional)",
          "description": "string (optional)",
          "order": "number (optional)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated brand object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Duplicate name), `500 Internal Server Error`.

### Delete Brand
-   **`DELETE /brands/:id`**
    -   **Description:** Deletes a brand. Note: If products are associated with this brand, their `brandId` will be set to `null` (due to schema `onDelete: SetNull`).
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Export/Import/Template
-   **`GET /brands/export`**: Downloads an Excel file of all brands.
-   **`POST /brands/import`**: Upload an Excel file (`multipart/form-data`, field `file`) to import brands. Returns `{ success: number, errors: string[] }`.
-   **`GET /brands/template`**: Downloads an empty Excel template for importing.

---

## Categories (`/categories`)

*(Structure similar to Brands, including List, Get by ID, Create, Update, Delete, Export, Import, Template endpoints. Note `onDelete: Restrict` means categories with associated products or sub-categories cannot be deleted directly.)*

---

## Orders (`/orders`)

*Note: All order routes require authentication via the `authenticate` middleware, unless otherwise specified.*

### List All Orders (Admin/Staff)
-   **`GET /orders`**
    -   **Description:** Retrieves a paginated list of all orders.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Query Parameters:**
        -   `page`, `limit`, `sortBy`, `sortOrder` (as in Brands)
        -   `status` (string, optional, e.g., `PENDING`, `CONFIRMED`): Filter by order status.
        -   `paymentStatus` (string, optional, e.g., `PAID`, `PENDING`): Filter by payment status.
        -   `userId` (string, optional): Filter by user ID.
    -   **Success Response (200 OK):**
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "userId": "uuid",
              "total": 150.00,
              "shippingFee": 5.00,
              "discountAmount": 15.00,
              "finalTotal": 140.00,
              "status": "PENDING",
              "paymentStatus": "PENDING",
              "paymentMethod": "COD",
              "note": "Leave at door",
              "transactionId": null,
              "createdAt": "timestamp",
              "updatedAt": "timestamp",
              "user": { "id": "uuid", "name": "User Name", "email": "..." },
              "_count": { "orderItems": 2 }
            }
            // ... more orders
          ],
          "total": 50, "page": 1, "limit": 20
        }
        ```
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

### Create Order
-   **`POST /orders`**
    -   **Description:** Creates a new order for the authenticated user. Calculates totals, applies voucher, decrements stock.
    -   **Requires Authentication:** Yes.
    -   **Request Body:**
        ```json
        {
          "shippingAddressId": "string (uuid, required)",
          "paymentMethod": "COD | CREDIT_CARD | VNPAY (required)",
          "items": [
            {
              "productId": "string (uuid, required)",
              "productVariantId": "string (uuid, optional)", // Required if product has variants
              "quantity": "number (integer, required, min: 1)"
            }
            // ... more items
          ],
          "voucherCode": "string (optional)",
          "note": "string (optional)",
          "shippingFee": "number (optional, default: 0)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created order object with details.
    -   **Error Responses:** `400 Bad Request` (Validation failed, insufficient stock, invalid voucher), `401 Unauthorized`, `404 Not Found` (Product/Variant/Address not found), `500 Internal Server Error`.

### Get My Orders
-   **`GET /orders/myorders`**
    -   **Description:** Retrieves orders placed by the currently authenticated user.
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns an array of order objects with details.
    -   **Error Responses:** `401 Unauthorized`, `500 Internal Server Error`.

### Get Order by ID
-   **`GET /orders/:id`**
    -   **Description:** Retrieves a specific order. User must own the order or be Staff/Admin.
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns the detailed order object including items, user, address, voucher info.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Update Order Status
-   **`PUT /orders/:id/status`**
    -   **Description:** Updates the processing status of an order (e.g., PENDING -> CONFIRMED -> SHIPPED -> DELIVERED).
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Request Body:**
        ```json
        { "status": "CONFIRMED | SHIPPED | DELIVERED | CANCELED" }
        ```
    -   **Success Response (200 OK):** Returns the updated order object.
    -   **Error Responses:** `400 Bad Request` (Invalid status/transition), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Update Order Payment Status
-   **`PUT /orders/:id/payment-status`**
    -   **Description:** Updates the payment status of an order. Often used by payment gateway callbacks or manually by admins.
    -   **Requires Authentication:** Yes (Staff or Admin role - *adjust if used by unauthenticated callback*).
    -   **Request Body:**
        ```json
        {
          "paymentStatus": "PAID | FAILED | REFUNDED",
          "transactionId": "string (optional)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated order object.
    -   **Error Responses:** `400 Bad Request` (Invalid status), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
    -   *Note: Controller handler needs to be implemented and added to routes.*

### Cancel Order
-   **`PUT /orders/:id/cancel`**
    -   **Description:** Cancels an order (if status allows). Restocks items and potentially reverts voucher usage.
    -   **Requires Authentication:** Yes (Order owner or Staff/Admin role).
    -   **Success Response (200 OK):** Returns the updated (canceled) order object.
    -   **Error Responses:** `400 Bad Request` (Order cannot be canceled), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

## Products (`/products`)

### List Products
-   **`GET /products`**
    -   **Description:** Retrieves a paginated list of products.
    -   **Query Parameters:**
        -   `page`, `limit`, `sortBy`, `sortOrder` (as in Brands)
        -   `categoryId` (string, optional): Filter by category ID.
        -   `brandId` (string, optional): Filter by brand ID.
        -   `minPrice` (number, optional): Filter by minimum price.
        -   `maxPrice` (number, optional): Filter by maximum price.
        -   *Add other filters like `tag`, `search` if implemented.*
    -   **Success Response (200 OK):** Returns `{ data: [product objects], total: number }`. Products include basic `images`, `category`, `brand`, `tags`, `variants`.
    -   **Error Responses:** `500 Internal Server Error`.

### Get Product by ID
-   **`GET /products/:id`**
    -   **Description:** Retrieves a specific product with full details including images, category, brand, tags, and variants.
    -   **Success Response (200 OK):** Returns the detailed product object.
    -   **Error Responses:** `404 Not Found`, `500 Internal Server Error`.

### Create Product
-   **`POST /products`**
    -   **Description:** Creates a new product, including associated images, tags (connect or create), and variants.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:**
        ```json
        {
          "sku": "string (required, unique)",
          "name": "string (required)",
          "price": "number (required, positive)",
          "categoryId": "string (uuid, required)",
          "stock": "number (integer, required, >=0)", // Stock for base product if no variants
          "shortDescription": "string (optional)",
          "longDescription": "string (optional)",
          "discountPrice": "number (optional, positive)",
          "brandId": "string (uuid, optional)",
          "active": "boolean (optional, default: true)",
          "images": [ // Optional array
            { "url": "string (uri, required)", "order": "number (optional)", "isThumbnail": "boolean (optional, default: false)" }
          ],
          "tags": [ "string (tag name)", "string" ], // Optional array of tag names
          "variants": [ // Optional array
            {
              "name": "string (required)", // e.g., "Red, Large"
              "price": "number (required)",
              "stock": "number (required)",
              "sku": "string (optional, unique within product)",
              "discountPrice": "number (optional)",
              "color": "string (optional)",
              "weight": "string (optional)",
              "material": "string (optional)"
            }
          ]
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created product object with its relations.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Category/Brand not found), `409 Conflict` (Duplicate SKU), `500 Internal Server Error`.

### Update Product
-   **`PUT /products/:id`**
    -   **Description:** Updates an existing product. Can update direct fields and replace associated tags. *Note: Updating images/variants via this endpoint is basic; use dedicated variant/image endpoints for complex changes.*
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:** Provide fields to update. `tags` array replaces existing tags.
        ```json
        {
          "name": "string (optional)",
          "price": "number (optional)",
          "stock": "number (optional)", // Base product stock
          "tags": ["tag-a", "tag-new"], // Replaces all previous tags
          // ... other fields from create body (excluding images/variants)
        }
        ```
    -   **Success Response (200 OK):** Returns the updated product object with relations.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Duplicate SKU), `500 Internal Server Error`.

### Delete Product
-   **`DELETE /products/:id`**
    -   **Description:** Deletes a product and its associated images and variants (due to schema `onDelete: Cascade`).
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

### Product Images (*Consider nesting: `/products/:productId/images`*)

*(Endpoints for GET, POST, PUT, DELETE images. Need clear definition of request/response bodies and authorization.)*

---

## Product Variants (`/products/:productId/variants`)

*Note: These routes are nested under a specific product. Authentication/Admin checks likely required.*

### List Product Variants
-   **`GET /products/:productId/variants`**
    -   **Description:** Retrieves all variants associated with a specific product ID.
    -   **Success Response (200 OK):** Returns an array of variant objects.
    -   **Error Responses:** `404 Not Found` (Product not found), `500 Internal Server Error`.

### Get Variant by ID
-   **`GET /products/:productId/variants/:variantId`**
    -   **Description:** Retrieves a specific variant by its ID.
    -   **Success Response (200 OK):** Returns the variant object.
    -   **Error Responses:** `404 Not Found`, `500 Internal Server Error`.

### Create Product Variant
-   **`POST /products/:productId/variants`**
    -   **Description:** Creates a new variant for the specified product.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:**
        ```json
        {
          "name": "string (required)", // e.g., "Red, Large"
          "price": "number (required)",
          "stock": "number (required)",
          "sku": "string (optional, unique within product)",
          "discountPrice": "number (optional)",
          "color": "string (optional)",
          "weight": "string (optional)",
          "material": "string (optional)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created variant object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Product not found), `409 Conflict` (Duplicate SKU/Name for this product), `500 Internal Server Error`.

### Update Product Variant
-   **`PUT /products/:productId/variants/:variantId`**
    -   **Description:** Updates an existing variant.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:** Provide fields to update.
        ```json
        {
          "price": "number (optional)",
          "stock": "number (optional)",
          // ... other fields from create body
        }
        ```
    -   **Success Response (200 OK):** Returns the updated variant object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Duplicate SKU/Name), `500 Internal Server Error`.

### Delete Product Variant
-   **`DELETE /products/:productId/variants/:variantId`**
    -   **Description:** Deletes a specific variant.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (If variant is linked in orders), `500 Internal Server Error`.

---

## Tags (`/tags`)

### List Tags
-   **`GET /tags`**
    -   **Description:** Retrieves a paginated list of tags, including the count of products associated with each tag.
    -   **Query Parameters:** `page`, `limit`, `sortBy`, `sortOrder` (as in Brands).
    -   **Success Response (200 OK):**
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "name": "Tag Name",
              "_count": { "products": 15 },
              "createdAt": "timestamp",
              "updatedAt": "timestamp"
            }
            // ... more tags
          ],
          "total": 50
        }
        ```
    -   **Error Responses:** `500 Internal Server Error`.

### Get Tag by ID
-   **`GET /tags/:id`**
    -   **Description:** Retrieves a specific tag by its ID, including product count.
    -   **Success Response (200 OK):** Returns the tag object.
    -   **Error Responses:** `404 Not Found`, `500 Internal Server Error`.

### Create Tag
-   **`POST /tags`**
    -   **Description:** Creates a new tag.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:**
        ```json
        { "name": "string (required, unique)" }
        ```
    -   **Success Response (201 Created):** Returns the newly created tag object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (Duplicate name), `500 Internal Server Error`.

### Update Tag
-   **`PUT /tags/:id`**
    -   **Description:** Updates an existing tag's name.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Request Body:**
        ```json
        { "name": "string (required, unique)" }
        ```
    -   **Success Response (200 OK):** Returns the updated tag object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Duplicate name), `500 Internal Server Error`.

### Delete Tag
-   **`DELETE /tags/:id`**
    -   **Description:** Deletes a tag. Note: This only deletes the tag itself; the association with products is removed automatically.
    -   **Requires Authentication:** Yes (Admin/Staff role likely required).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

## Vouchers (`/vouchers`)

### Get Voucher by Code (Public/Customer)
-   **`GET /vouchers/code/:code`**
    -   **Description:** Retrieves voucher details by its code. Useful for validating a voucher before applying it to an order.
    -   **Success Response (200 OK):** Returns the voucher object (potentially omitting sensitive fields like `usedCount`).
    -   **Error Responses:** `404 Not Found`.

### List Vouchers (Admin/Staff)
-   **`GET /vouchers`**
    -   **Description:** Retrieves a paginated list of all vouchers.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Query Parameters:** `page`, `limit`, `sortBy`, `sortOrder`, `isActive` (boolean).
    -   **Success Response (200 OK):** Returns `{ data: [voucher objects], total: number }`. Includes relations and order count.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

### Get Voucher by ID (Admin/Staff)
-   **`GET /vouchers/:id`**
    -   **Description:** Retrieves a specific voucher by its ID.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Success Response (200 OK):** Returns the voucher object with relations.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Create Voucher (Admin/Staff)
-   **`POST /vouchers`**
    -   **Description:** Creates a new voucher.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Request Body:**
        ```json
        {
          "code": "string (required, unique)",
          "type": "PERCENT | FIXED (required)",
          "discountPercent": "number (optional, required if type=PERCENT)",
          "discountAmount": "number (optional, required if type=FIXED)",
          "maxDiscount": "number (optional, for PERCENT type)",
          "startDate": "string (ISO 8601 date, required)",
          "endDate": "string (ISO 8601 date, required)",
          "usageLimit": "number (integer, optional)",
          "minimumOrderValue": "number (optional)",
          "isActive": "boolean (optional, default: true)",
          "applicableCategoryIds": ["uuid", "uuid"], // Optional array of Category IDs
          "excludedProductIds": ["uuid", "uuid"]    // Optional array of Product IDs
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created voucher object with relations.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (Duplicate code), `500 Internal Server Error`.

### Update Voucher (Admin/Staff)
-   **`PUT /vouchers/:id`**
    -   **Description:** Updates an existing voucher.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Request Body:** Provide fields to update. `applicableCategoryIds` and `excludedProductIds` arrays replace existing relations.
        ```json
        {
          "code": "string (optional, unique)",
          "discountPercent": "number (optional)",
          "isActive": "boolean (optional)",
          "applicableCategoryIds": ["uuid"], // Replaces previous categories
          "excludedProductIds": [] // Removes all excluded products
          // ... other fields from create body
        }
        ```
    -   **Success Response (200 OK):** Returns the updated voucher object with relations.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Duplicate code), `500 Internal Server Error`.

### Delete Voucher (Admin/Staff)
-   **`DELETE /vouchers/:id`**
    -   **Description:** Deletes a voucher. Associated orders will have their `voucherId` set to `null`.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

## Reviews (`/reviews`)

### Create Review
-   **`POST /reviews`**
    -   **Description:** Creates a new review for a specific order item. User must own the order item. Updates product's average rating.
    -   **Requires Authentication:** Yes.
    -   **Request Body:**
        ```json
        {
          "orderItemId": "string (uuid, required)",
          "rating": "number (integer, required, 1-5)",
          "comment": "string (optional, max 1000 chars)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created review object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden` (User doesn't own order item), `404 Not Found` (Order item not found), `409 Conflict` (Review already exists for this item), `500 Internal Server Error`.

### Get My Reviews
-   **`GET /reviews/my`**
    -   **Description:** Retrieves reviews submitted by the currently authenticated user.
    -   **Requires Authentication:** Yes.
    -   **Query Parameters:** `page`, `limit`, `sortBy`, `sortOrder`.
    -   **Success Response (200 OK):** Returns `{ data: [review objects], total: number }`. Reviews include basic product/variant info.
    -   **Error Responses:** `401 Unauthorized`, `500 Internal Server Error`.

### Update Review
-   **`PUT /reviews/:reviewId`**
    -   **Description:** Updates the rating and/or comment of a specific review. User must own the review or be an Admin. Updates product's average rating.
    -   **Requires Authentication:** Yes.
    -   **Request Body:**
        ```json
        {
          "rating": "number (integer, optional, 1-5)",
          "comment": "string (optional, max 1000 chars)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated review object.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Delete Review
-   **`DELETE /reviews/:reviewId`**
    -   **Description:** Deletes a specific review. User must own the review or be an Admin. Updates product's average rating.
    -   **Requires Authentication:** Yes.
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Get Product Reviews (*Requires Route Addition*)
-   **`GET /products/:productId/reviews`**
    -   **Description:** Retrieves reviews for a specific product. (Public or Authenticated).
    -   **Query Parameters:** `page`, `limit`, `sortBy`, `sortOrder`.
    -   **Success Response (200 OK):** Returns `{ data: [review objects], total: number, average: number | null }`. Reviews include basic user info.
    -   **Error Responses:** `404 Not Found` (Product not found), `500 Internal Server Error`.
    -   *Note: This endpoint needs to be added to `product.routes.ts` and linked to `reviewController.getProductReviews`.*

---

## Blogs (`/blogs`)

### List Blog Posts (Public)
-   **`GET /blogs`**
    -   **Description:** Retrieves a paginated list of active blog posts. Admins/Staff may see inactive posts via query param.
    -   **Query Parameters:**
        -   `page`, `limit`, `sortBy`, `sortOrder` (defaults: `publicationDate`, `desc`)
        -   `active` (boolean, optional, Admin/Staff only): Set to `false` to include inactive posts.
        -   `authorId` (string, optional): Filter by author's user ID.
    -   **Success Response (200 OK):** Returns `{ data: [blog objects], total: number }`. Includes basic author info.
    -   **Error Responses:** `500 Internal Server Error`.

### Get Blog Post by ID (Public)
-   **`GET /blogs/:id`**
    -   **Description:** Retrieves a specific blog post by its ID. Only returns active posts unless user is Admin/Staff.
    -   **Success Response (200 OK):** Returns the blog post object with author info.
    -   **Error Responses:** `404 Not Found` (Post not found or inactive for public), `500 Internal Server Error`.

### Create Blog Post (Admin/Staff)
-   **`POST /blogs`**
    -   **Description:** Creates a new blog post.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Request Body:**
        ```json
        {
          "title": "string (required, max 255)",
          "content": "string (required)",
          "thumbnail": "string (uri, optional)",
          "publicationDate": "string (ISO 8601 date, optional, defaults to now)",
          "active": "boolean (optional, default: true)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created blog post object with author info.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

### Update Blog Post (Author/Admin/Staff)
-   **`PUT /blogs/:id`**
    -   **Description:** Updates an existing blog post. Author can update their own; Admin/Staff can update any.
    -   **Requires Authentication:** Yes.
    -   **Request Body:** Provide fields to update.
        ```json
        {
          "title": "string (optional, max 255)",
          "content": "string (optional)",
          "thumbnail": "string (uri, optional)",
          "publicationDate": "string (ISO 8601 date, optional)",
          "active": "boolean (optional)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated blog post object with author info.
    -   **Error Responses:** `400 Bad Request` (Validation failed), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Delete Blog Post (Author/Admin/Staff)
-   **`DELETE /blogs/:id`**
    -   **Description:** Deletes a blog post. Author can delete their own; Admin/Staff can delete any.
    -   **Requires Authentication:** Yes.
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

## Shipping Addresses (`/shipping-addresses`)

*Note: All routes require authentication.*

### Create Shipping Address
-   **`POST /shipping-addresses`**
    -   **Description:** Creates a new shipping address for the authenticated user.
    -   **Requires Authentication:** Yes.
    -   **Request Body:**
        ```json
        {
          "address": "string (required)",
          "receiverName": "string (required)",
          "receiverPhone": "string (required)"
        }
        ```
    -   **Success Response (201 Created):** Returns the newly created address object.
    -   **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`.

### List My Shipping Addresses
-   **`GET /shipping-addresses`**
    -   **Description:** Retrieves all shipping addresses associated with the authenticated user.
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns an array of address objects.
    -   **Error Responses:** `401 Unauthorized`, `500 Internal Server Error`.

### Get Shipping Address by ID
-   **`GET /shipping-addresses/:id`**
    -   **Description:** Retrieves a specific shipping address (must belong to the authenticated user).
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns the address object.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Update Shipping Address
-   **`PUT /shipping-addresses/:id`**
    -   **Description:** Updates a specific shipping address (must belong to the authenticated user).
    -   **Requires Authentication:** Yes.
    -   **Request Body:** Provide fields to update.
        ```json
        {
          "address": "string (optional)",
          "receiverName": "string (optional)",
          "receiverPhone": "string (optional)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated address object.
    -   **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Delete Shipping Address
-   **`DELETE /shipping-addresses/:id`**
    -   **Description:** Deletes a specific shipping address (must belong to the authenticated user). Note: Cannot delete if address is used in existing orders (due to schema `onDelete: Restrict`).
    -   **Requires Authentication:** Yes.
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Address in use), `500 Internal Server Error`.

---

## Users (`/users`)

*Note: Requires authentication. Specific actions may require Admin/Staff roles.*

### List Users (Admin/Staff)
-   **`GET /users`**
    -   **Description:** Retrieves a paginated list of all users.
    -   **Requires Authentication:** Yes (Staff or Admin role).
    -   **Query Parameters:** `page`, `limit`, `sortBy`, `sortOrder`.
    -   **Success Response (200 OK):** Returns `{ data: [user objects (SafeUser)], total: number }`.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`.

### Get User by ID
-   **`GET /users/:id`**
    -   **Description:** Retrieves a specific user's profile. Authenticated user can get their own profile; Staff/Admin can get any profile.
    -   **Requires Authentication:** Yes.
    -   **Success Response (200 OK):** Returns the user object (SafeUser).
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden` (If non-admin tries to access other user), `404 Not Found`, `500 Internal Server Error`.

### Update User Profile
-   **`PUT /users/:id`**
    -   **Description:** Updates a user's profile. Users can update their own profile (requires `oldPassword` if changing `password`). Admin/Staff can update other users and modify `isActive` and `role`.
    -   **Requires Authentication:** Yes.
    -   **Request Body:** Provide fields to update.
        ```json
        {
          "name": "string (optional)",
          "phone": "string (optional)",
          "address": "string (optional)",
          "imgUrl": "string (uri, optional)",
          "gender": "MALE | FEMALE | OTHER (optional)",
          "dob": "string (YYYY-MM-DD, optional)",
          "password": "string (optional, min 6)", // New password
          "oldPassword": "string (required if user updates own password)",
          // Admin/Staff only fields:
          "isActive": "boolean (optional)",
          "role": "CUSTOMER | STAFF | ADMIN (optional)"
        }
        ```
    -   **Success Response (200 OK):** Returns the updated user object (SafeUser).
    -   **Error Responses:** `400 Bad Request` (Validation failed, old password required/incorrect), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### Delete User (Admin)
-   **`DELETE /users/:id`**
    -   **Description:** Deletes a user account.
    -   **Requires Authentication:** Yes (Admin role).
    -   **Success Response (204 No Content):** No response body.
    -   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---
