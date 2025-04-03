# API Documentation

This document outlines the available API endpoints for the Coffee Craft Service.

## Authentication (`/auth`)

-   **`POST /auth/register`**: Register a new user.
    -   Controller: `register`
-   **`POST /auth/login`**: Log in a user.
    -   Controller: `login`
-   **`POST /auth/logout`**: Log out the currently authenticated user.
    -   Controller: `logout`
-   **`GET /auth/me`**: Get the profile of the currently authenticated user.
    -   Middleware: `authenticate`
    -   Controller: `me`

## Brands (`/brands`)

-   **`GET /brands`**: Get a list of all brands.
    -   Controller: `getBrands`
-   **`GET /brands/:id`**: Get a specific brand by its ID.
    -   Controller: `getBrand`
-   **`POST /brands`**: Create a new brand.
    -   Middleware: `validateRequestBody(createBrandSchema)`
    -   Controller: `createBrandHandler`
-   **`PUT /brands/:id`**: Update an existing brand by its ID.
    -   Middleware: `validateRequestBody(updateBrandSchema)`
    -   Controller: `updateBrandHandler`
-   **`DELETE /brands/:id`**: Delete a brand by its ID.
    -   Controller: `deleteBrandHandler`
-   **`GET /brands/export`**: Export all brands to an Excel file.
    -   Controller: `exportBrands`
-   **`POST /brands/import`**: Import brands from an Excel file.
    -   Requires `multipart/form-data` with a file field named `file`.
    -   Controller: `importBrands`
-   **`GET /brands/template`**: Download an Excel template for importing brands.
    -   Controller: `downloadBrandTemplate`

## Categories (`/categories`)

-   **`GET /categories`**: Get a list of all categories.
    -   Controller: `getCategories`
-   **`GET /categories/:id`**: Get a specific category by its ID.
    -   Controller: `getCategory`
-   **`POST /categories`**: Create a new category.
    -   Middleware: `validateRequestBody(createCategorySchema)`
    -   Controller: `createCategoryHandler`
-   **`PUT /categories/:id`**: Update an existing category by its ID.
    -   Middleware: `validateRequestBody(updateCategorySchema)`
    -   Controller: `updateCategoryHandler`
-   **`DELETE /categories/:id`**: Delete a category by its ID.
    -   Controller: `deleteCategoryHandler`
-   **`GET /categories/export`**: Export all categories to an Excel file.
    -   Controller: `exportCategories`
-   **`POST /categories/import`**: Import categories from an Excel file.
    -   Requires `multipart/form-data` with a file field named `file`.
    -   Controller: `importCategories`
-   **`GET /categories/template`**: Download an Excel template for importing categories.
    -   Controller: `downloadCategoryTemplate`

## Orders (`/orders`)

*Note: All order routes require authentication via the `authenticate` middleware.*

-   **`GET /orders`**: Get a list of all orders. (Staff/Admin only).
    -   Middleware: `isStaffOrAdmin`
    -   Controller: `handleGetAllOrders`
-   **`POST /orders`**: Create a new order. (Customer)
    -   Middleware: `validateRequestBody(createOrderSchema)`
    -   Controller: `handleCreateOrder`
-   **`GET /orders/myorders`**: Get orders placed by the currently authenticated user. (Customer)
    -   Controller: `handleGetMyOrders`
-   **`GET /orders/:id`**: Get a specific order by its ID. (User must own the order or be Staff/Admin).
    -   Controller: `handleGetOrderById`
-   **`PUT /orders/:id/status`**: Update the status of an order. (Staff/Admin only).
    -   Middleware: `isStaffOrAdmin`, `validateRequestBody(updateOrderStatusSchema)`
    -   Controller: `handleUpdateOrderStatus`
-   **`PUT /orders/:id/cancel`**: Cancel an order. (Order owner or Staff/Admin).
    -   Controller: `handleCancelOrder`

## Products (`/products`)

-   **`GET /products/image`**: Get product images (details might be in the controller).
    -   Controller: `getProductImages`
-   **`POST /products/image`**: Create a new product image.
    -   Controller: `createProductImage`
-   **`PUT /products/image/:id`**: Update a product image by its ID.
    -   Controller: `updateProductImage`
-   **`DELETE /products/image/:id`**: Delete a product image by its ID.
    -   Controller: `deleteProductImage`
-   **`GET /products`**: Get a list of all products.
    -   Controller: `getProducts`
-   **`GET /products/:id`**: Get a specific product by its ID.
    -   Controller: `getProduct`
-   **`POST /products`**: Create a new product.
    -   Middleware: `validateRequestBody(createProductSchema)`
    -   Controller: `createProduct`
    -   *Note: Authentication/Admin checks are commented out in the route file.*
-   **`PUT /products/:id`**: Update an existing product by its ID.
    -   Middleware: `validateRequestBody(updateProductSchema)`
    -   Controller: `updateProduct`
    -   *Note: Authentication/Admin checks are commented out in the route file.*
-   **`DELETE /products/:id`**: Delete a product by its ID.
    -   Middleware: `errorHandler`
    -   Controller: `deleteProduct`
    -   *Note: Authentication/Admin checks are commented out in the route file.*

## Product Variants (`/products/:productId/variants`)

*Note: These routes are likely nested under a specific product.*
*Note: Authentication/Admin checks might apply, similar to Products.*

-   **`GET /products/:productId/variants`**: Get all variants for a specific product.
    -   Controller: `getProductVariants`
-   **`GET /products/:productId/variants/:variantId`**: Get a specific product variant by its ID.
    -   Controller: `getVariant`
-   **`POST /products/:productId/variants`**: Create a new variant for a specific product.
    -   Middleware: `validateRequestBody(createVariantSchema)`
    -   Controller: `createVariantHandler`
-   **`PUT /products/:productId/variants/:variantId`**: Update an existing product variant by its ID.
    -   Middleware: `validateRequestBody(updateVariantSchema)`
    -   Controller: `updateVariantHandler`
-   **`DELETE /products/:productId/variants/:variantId`**: Delete a product variant by its ID.
    -   Controller: `deleteVariantHandler`


## Tags (`/tags`)

*Note: Authentication/Admin checks might apply for modification endpoints (currently commented out in routes).*

-   **`GET /tags`**: Get a list of all tags.
    -   Controller: `getTags`
-   **`GET /tags/:id`**: Get a specific tag by its ID.
    -   Controller: `getTag`
-   **`POST /tags`**: Create a new tag.
    -   Middleware: `validateRequestBody(createTagSchema)`
    -   Controller: `createTagHandler`
-   **`PUT /tags/:id`**: Update an existing tag by its ID.
    -   Middleware: `validateRequestBody(updateTagSchema)`
    -   Controller: `updateTagHandler`
-   **`DELETE /tags/:id`**: Delete a tag by its ID.
    -   Controller: `deleteTagHandler`


## Shipping Addresses (`/shipping-addresses`)

*Note: All shipping address routes require authentication via the `authenticate` middleware.*

-   **`POST /shipping-addresses`**: Create a new shipping address for the authenticated user.
    -   Middleware: `validateRequestBody(createShippingAddressSchema)`
    -   Controller: `createAddress`
-   **`GET /shipping-addresses`**: Get all shipping addresses for the authenticated user.
    -   Controller: `getAddresses`
-   **`GET /shipping-addresses/:id`**: Get a specific shipping address by its ID.
    -   Controller: `getAddressById`
-   **`PUT /shipping-addresses/:id`**: Update an existing shipping address by its ID.
    -   Middleware: `validateRequestBody(updateShippingAddressSchema)`
    -   Controller: `updateAddress`
-   **`DELETE /shipping-addresses/:id`**: Delete a shipping address by its ID.
    -   Controller: `deleteAddress`

## Users (`/users`)

*Note: All user routes require authentication via the `authenticate` middleware.*

-   **`GET /users`**: Get a list of all users. (Staff/Admin only).
    -   Middleware: `isStaffOrAdmin`
    -   Controller: `getAllUsers`
-   **`GET /users/:id`**: Get a specific user by ID. (Authenticated user can get their own profile, Staff/Admin can get any).
    -   Controller: `getUserById`
-   **`PUT /users/:id`**: Update a user's profile. (User can update their own, Admin can update any - verification likely in controller).
    -   Middleware: `validateRequestBody(updateUserProfileSchema)`
    -   Controller: `updateUser`
-   **`DELETE /users/:id`**: Delete a user by ID. (Admin only).
    -   Middleware: `isAdmin`
    -   Controller: `deleteUser`
