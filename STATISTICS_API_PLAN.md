# Statistics API Plan

## 1. Introduction

This document outlines the plan for implementing statistical APIs for the Coffee Craft Service backend. The initial focus is on providing key metrics related to Revenue/Orders and Products. These APIs are intended for internal use by STAFF and ADMIN users.

## 2. Default Date Range Behavior

Unless specific query parameters (`period`, `startDate`, `endDate`) are provided, all time-based statistics APIs will **default to showing data for the "Last 30 Days"** (inclusive of the current day).

Users can override this default by specifying:
*   `period`: `daily`, `weekly`, `monthly`, `yearly` (calculates based on the current calendar period).
*   `period=custom` along with `startDate` and `endDate` (YYYY-MM-DD format) for a specific custom range.

## 3. API Endpoint Definitions

### 3.1. Revenue & Order Statistics (`/stats/revenue`)

These endpoints provide insights into sales performance and order processing.

**Base Path:** `/stats/revenue`
**Authentication:** Required (Cookie-based `access_token`)
**Authorization:** STAFF or ADMIN role required.

---

#### `GET /summary`

*   **Purpose:** Provides a high-level summary of revenue and order counts for a given period.
*   **Query Parameters:**
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`. Must be >= `startDate`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "endDate": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "totalRevenue": 150500000.75, // Based on finalTotal of relevant orders (e.g., CONFIRMED, SHIPPED, DELIVERED)
      "totalOrders": 520,         // Count of relevant orders
      "averageOrderValue": 289424.42
    }
    ```

---

#### `GET /by-payment-method`

*   **Purpose:** Breaks down revenue and order count by the payment method used.
*   **Query Parameters:** Same as `/summary`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "data": [
        { "paymentMethod": "COD", "totalRevenue": 80000000.00, "orderCount": 300 },
        { "paymentMethod": "VNPAY", "totalRevenue": 50500000.75, "orderCount": 150 },
        { "paymentMethod": "CREDIT_CARD", "totalRevenue": 20000000.00, "orderCount": 70 }
      ]
    }
    ```

---

#### `GET /orders/by-status`

*   **Purpose:** Shows the distribution of orders across different statuses (PENDING, CONFIRMED, etc.).
*   **Query Parameters:** Same as `/summary`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "data": [
        { "status": "PENDING", "orderCount": 15, "totalValue": 4500000.00 },
        { "status": "CONFIRMED", "orderCount": 25, "totalValue": 7800000.00 },
        { "status": "SHIPPED", "orderCount": 180, "totalValue": 55000000.00 },
        { "status": "DELIVERED", "orderCount": 280, "totalValue": 79700000.75 },
        { "status": "CANCELED", "orderCount": 20, "totalValue": 3500000.00 }
        // Includes all statuses, even if count is 0 for the period
      ]
    }
    ```

---

#### `GET /orders/by-payment-status`

*   **Purpose:** Shows the distribution of orders across different payment statuses (PENDING, PAID, etc.).
*   **Query Parameters:** Same as `/summary`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "data": [
        { "paymentStatus": "PENDING", "orderCount": 10, "totalValue": 3000000.00 },
        { "paymentStatus": "PAID", "orderCount": 495, "totalValue": 145000000.75 },
        { "paymentStatus": "FAILED", "orderCount": 5, "totalValue": 1000000.00 },
        { "paymentStatus": "REFUNDED", "orderCount": 10, "totalValue": 1500000.00 }
        // Includes all payment statuses, even if count is 0
      ]
    }
    ```

---

#### `GET /orders/financials`

*   **Purpose:** Summarizes total shipping fees collected and discounts applied.
*   **Query Parameters:** Same as `/summary`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "totalShippingFee": 5200000.00,
      "totalDiscountAmount": 15300000.50 // Based on Order.discountAmount
    }
    ```

---

### 3.2. Product Statistics (`/stats/products`)

These endpoints provide insights into product sales performance and inventory levels.

**Base Path:** `/stats/products`
**Authentication:** Required (Cookie-based `access_token`)
**Authorization:** STAFF or ADMIN role required.

---

#### `GET /top-selling`

*   **Purpose:** Identifies the best-performing products based on quantity sold or revenue generated.
*   **Query Parameters:**
    *   `sortBy` (string, optional, enum: `quantity`, `revenue`, default: `quantity`): Criterion for ranking.
    *   `limit` (integer, optional, min: 1, max: 100, default: 10): Number of products to return.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `categoryId` (string, optional, format: uuid): Filter by a specific category.
    *   `brandId` (string, optional, format: uuid): Filter by a specific brand.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "sortBy": "quantity",
      "limit": 10,
      "data": [
        { "productId": "uuid-prod-1", "name": "Cà phê Robusta", "sku": "CF-RB-001", "totalQuantitySold": 1200, "totalRevenue": 60000000.00 },
        { "productId": "uuid-prod-2", "name": "Phin nhôm", "sku": "TOOL-PHIN-01", "totalQuantitySold": 850, "totalRevenue": 42500000.00 }
        // ... more products
      ]
    }
    ```

---

#### `GET /performance`

*   **Purpose:** Compares sales performance across different product categories or brands.
*   **Query Parameters:**
    *   `groupBy` (string, required, enum: `category`, `brand`): Dimension to group results by.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK - Example groupBy=category):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "groupBy": "category",
      "data": [
        { "id": "uuid-cat-1", "name": "Cà phê hạt", "totalQuantitySold": 2500, "totalRevenue": 120000000.00 },
        { "id": "uuid-cat-2", "name": "Dụng cụ pha chế", "totalQuantitySold": 1500, "totalRevenue": 75000000.00 }
        // ... more categories/brands
      ]
    }
    ```

---

#### `GET /inventory`

*   **Purpose:** Provides an overview of current inventory levels, highlighting low-stock items.
*   **Query Parameters:**
    *   `lowStockThreshold` (integer, optional, min: 0, default: 10): The stock level at or below which a product is considered "low stock".
*   **Response Body (200 OK):**
    ```json
    {
      "lowStockThreshold": 10, // The threshold used for the 'lowStockProducts' list
      "summary": {
          "totalProducts": 580,         // Total number of active products being tracked
          "productsInStock": 550,       // Count of products with stock > 0
          "productsLowStock": 15,       // Count of products with 0 < stock <= lowStockThreshold
          "productsOutOfStock": 15,     // Count of products with stock = 0
          "totalInventoryValue": 550750000.00 // Sum(product.price * product.stock) for products with stock > 0
      },
      "lowStockProducts": [ // List of products with 0 < stock <= lowStockThreshold
        { "productId": "uuid-prod-5", "name": "Cốc sứ", "sku": "CUP-CER-03", "stock": 8 },
        { "productId": "uuid-prod-9", "name": "Cà phê Arabica", "sku": "CF-AR-002", "stock": 5 }
        // ... potentially more products
      ],
      "outOfStockProducts": [ // List of products with stock = 0
         { "productId": "uuid-prod-12", "name": "Bình lắc", "sku": "TOOL-SHAKE-01", "stock": 0 }
         // ... potentially more products
      ]
    }
    ```

---

#### `GET /variants/performance`

*   **Purpose:** Analyzes the sales performance of different variants within a single product.
*   **Query Parameters:**
    *   `productId` (string, required, format: uuid): The ID of the parent product.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "productId": "uuid-prod-1",
      "productName": "Cà phê Robusta",
      "data": [
        { "variantId": "uuid-var-1a", "name": "Robusta - 250g", "sku": "CF-RB-001-250", "totalQuantitySold": 700, "totalRevenue": 35000000.00 },
        { "variantId": "uuid-var-1b", "name": "Robusta - 500g", "sku": "CF-RB-001-500", "totalQuantitySold": 500, "totalRevenue": 25000000.00 }
        // ... more variants
      ]
    }
    ```

---

### 3.3. User Statistics (`/stats/users`)

These endpoints provide insights into user registration and activity.

**Base Path:** `/stats/users`
**Authentication:** Required (Cookie-based `access_token`)
**Authorization:** STAFF or ADMIN role required.

---

#### `GET /summary`

*   **Purpose:** Provides a high-level summary of user counts.
*   **Query Parameters:**
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period for 'newUsers'. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `activeThresholdDays` (integer, optional, default: 30): Number of days to look back for 'activeUsers' based on `lastLogin`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...", // Period for newUsers count
      "endDate": "...",   // Period for newUsers count
      "totalUsers": 12500, // Total count from User table
      "newUsersInPeriod": 350, // Count of Users with createdAt within the period
      "activeUsers": 4500 // Count of Users with lastLogin within activeThresholdDays from now
    }
    ```

---

#### `GET /role-distribution`

*   **Purpose:** Shows the count of users for each defined role.
*   **Query Parameters:** None.
*   **Response Body (200 OK):**
    ```json
    {
      "data": [
        { "role": "CUSTOMER", "count": 12450 },
        { "role": "STAFF", "count": 45 },
        { "role": "ADMIN", "count": 5 }
      ]
    }
    ```

---

#### `GET /top-spenders`

*   **Purpose:** Identifies customers who have spent the most in a given period.
*   **Query Parameters:**
    *   `limit` (integer, optional, min: 1, max: 100, default: 10): Number of users to return.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period for orders. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "limit": 10,
      "data": [
        { "userId": "uuid-user-1", "name": "Nguyen Van A", "email": "a@example.com", "totalSpent": 5500000.00, "orderCount": 15 },
        { "userId": "uuid-user-2", "name": "Tran Thi B", "email": "b@example.com", "totalSpent": 4800000.00, "orderCount": 12 }
        // ... more users
      ]
    }
    ```
    *   **Logic:** Sum `Order.finalTotal` grouped by `userId`. Filter orders by `createdAt` within the period and potentially by status (e.g., DELIVERED). Join with `User` to get details. Sort descending by `totalSpent`.

---

#### `GET /new-registrations`

*   **Purpose:** Tracks the number of new user registrations over time (daily, weekly, etc.).
*   **Query Parameters:**
    *   `groupBy` (string, optional, enum: `day`, `week`, `month`, default: `day`): Time unit for grouping.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Overall time window. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "groupBy": "day",
      "data": [
        { "date": "2025-03-15", "count": 25 },
        { "date": "2025-03-16", "count": 30 },
        { "date": "2025-03-17", "count": 18 }
        // ... more date entries
      ]
    }
    ```
    *   **Logic:** Count `User` records grouped by the date part (`day`, `week`, `month`) of `createdAt`. Filter by `createdAt` within the overall period.

---

### 3.4. Voucher Statistics (`/stats/vouchers`)

These endpoints analyze the usage and effectiveness of discount vouchers.

**Base Path:** `/stats/vouchers`
**Authentication:** Required (Cookie-based `access_token`)
**Authorization:** STAFF or ADMIN role required.

---

#### `GET /usage`

*   **Purpose:** Shows how many times each voucher code has been used within a period.
*   **Query Parameters:**
    *   `limit` (integer, optional, min: 1, max: 100, default: 10): Number of vouchers to return.
    *   `sortBy` (string, optional, enum: `usageCount`, `totalDiscount`, default: `usageCount`): Criterion for ranking.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period for orders using the voucher. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "limit": 10,
      "sortBy": "usageCount",
      "data": [
        { "voucherId": "uuid-vouch-1", "code": "WELCOME10", "type": "PERCENT", "usageCount": 150, "totalDiscountGiven": 7500000.00 },
        { "voucherId": "uuid-vouch-2", "code": "SHIPFREE", "type": "FIXED", "usageCount": 120, "totalDiscountGiven": 3600000.00 }
        // ... more vouchers
      ]
    }
    ```
    *   **Logic:** Count `Order` records grouped by `voucherId`. Filter orders by `createdAt` within the period and where `voucherId` is not null. Sum `Order.discountAmount` for `totalDiscountGiven`. Join with `Voucher` to get details. Sort and limit.

---

#### `GET /effectiveness`

*   **Purpose:** Provides detailed metrics for specific voucher codes or all active ones.
*   **Query Parameters:**
    *   `voucherCode` (string, optional): Filter by a specific voucher code. If omitted, returns data for all vouchers used in the period.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "data": [ // Array even if filtered by single code
        {
          "voucherId": "uuid-vouch-1",
          "code": "WELCOME10",
          "type": "PERCENT",
          "usageCount": 150,
          "totalDiscountGiven": 7500000.00,
          "totalRevenueFromOrders": 85000000.00 // Sum of finalTotal for orders using this voucher
        }
        // ... potentially more vouchers if voucherCode was omitted
      ]
    }
    ```
    *   **Logic:** Similar to `/usage`, but also sums `Order.finalTotal` for orders using the voucher(s). Filter by `voucherCode` if provided.

---

### 3.5. Review Statistics (`/stats/reviews`)

These endpoints provide insights into customer feedback and product ratings.

**Base Path:** `/stats/reviews`
**Authentication:** Required (Cookie-based `access_token`)
**Authorization:** STAFF or ADMIN role required.

---

#### `GET /summary`

*   **Purpose:** Gives an overall picture of product reviews.
*   **Query Parameters:**
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period for 'newReviews'. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...", // Period for newReviews count
      "endDate": "...",   // Period for newReviews count
      "averageRating": 4.35, // Average of Review.rating across all reviews
      "totalReviews": 850,  // Total count from Review table
      "newReviewsInPeriod": 120 // Count of Reviews with createdAt within the period
    }
    ```

---

#### `GET /rating-distribution`

*   **Purpose:** Shows the number of reviews for each star rating (1 to 5).
*   **Query Parameters:**
    *   `productId` (string, optional, format: uuid): Filter by a specific product.
    *   `period` (string, optional, enum: `daily`, `weekly`, `monthly`, `yearly`, `custom`): Time period. Defaults to "Last 30 Days" logic if omitted.
    *   `startDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
    *   `endDate` (string, optional, format: YYYY-MM-DD): Required if `period=custom`.
*   **Response Body (200 OK):**
    ```json
    {
      "startDate": "...",
      "endDate": "...",
      "productId": "uuid-prod-1" // or null if not filtered
      "data": [
        { "rating": 5, "count": 550 },
        { "rating": 4, "count": 200 },
        { "rating": 3, "count": 50 },
        { "rating": 2, "count": 25 },
        { "rating": 1, "count": 25 }
      ]
    }
    ```
    *   **Logic:** Count `Review` records grouped by `rating`. Filter by `createdAt` and optionally by `productId`.

---

#### `GET /by-product`

*   **Purpose:** Lists products along with their average rating and review count. Useful for identifying highly or poorly rated products.
*   **Query Parameters:**
    *   `limit` (integer, optional, min: 1, max: 100, default: 10): Number of products per page.
    *   `page` (integer, optional, min: 1, default: 1): Page number for pagination.
    *   `sortBy` (string, optional, enum: `avgRatingDesc`, `avgRatingAsc`, `reviewCountDesc`, `reviewCountAsc`, default: `reviewCountDesc`): Sorting criterion.
    *   `minReviews` (integer, optional, min: 0, default: 0): Only include products with at least this many reviews.
*   **Response Body (200 OK):**
    ```json
    {
      "page": 1,
      "limit": 10,
      "totalPages": 58, // Calculated based on total matching products and limit
      "totalProducts": 575, // Total products matching the criteria (e.g., minReviews)
      "data": [
        { "productId": "uuid-prod-1", "name": "Cà phê Robusta", "sku": "CF-RB-001", "averageRating": 4.5, "reviewCount": 150 },
        { "productId": "uuid-prod-2", "name": "Phin nhôm", "sku": "TOOL-PHIN-01", "averageRating": 4.2, "reviewCount": 110 }
        // ... more products
      ]
    }
    ```
    *   **Logic:** Calculate average `rating` and count reviews grouped by `productId`. Join with `Product` for details. Apply `minReviews` filter, sort, and paginate.

---

## 4. General Considerations

*   **Authentication & Authorization:** Middleware (`authenticate`, `isStaffOrAdmin`) is applied to ensure only logged-in STAFF or ADMIN users can access these endpoints.
*   **Database Indexing:** Add database indexes to relevant fields used in `WHERE` clauses and `GROUP BY` operations (e.g., `Order.createdAt`, `Order.status`, `OrderItem.productId`, `Product.categoryId`, `Product.brandId`, `Product.stock`) to optimize query performance.
*   **Performance:** For large datasets, consider caching strategies or creating pre-aggregated summary tables updated periodically. Be mindful of queries fetching large numbers of records (e.g., `getProductInventory`).
*   **Validation:** Input parameters (especially dates and enums) are validated using Joi schemas via middleware.
*   **Timezone:** Date calculations should consistently use a defined timezone (e.g., 'Asia/Ho_Chi_Minh' or UTC). The `period.util.ts` utility handles this.
*   **Swagger:** JSDoc comments are added to route files, and the main Swagger config includes `src/routes/**/*.ts` to ensure these APIs appear in the documentation.

## 5. API Structure Diagram (Mermaid)

```mermaid
graph TD
    subgraph "Statistics API (/stats)"
        subgraph "Revenue & Orders (/stats/revenue)"
            RevSum["GET /summary"]
            RevPay["GET /by-payment-method"]
            OrdStatus["GET /orders/by-status"]
            OrdPayStatus["GET /orders/by-payment-status"]
            OrdFin["GET /orders/financials"]
        end

        subgraph "Products (/stats/products)"
            ProdTop["GET /top-selling"]
            ProdPerf["GET /performance"]
            ProdInv["GET /inventory"]
            ProdVarPerf["GET /variants/performance"]
        end

        subgraph "Users (/stats/users)"
            UserSum["GET /summary"]
            UserRole["GET /role-distribution"]
            UserTopSpend["GET /top-spenders"]
            UserNewReg["GET /new-registrations"]
        end

        subgraph "Vouchers (/stats/vouchers)"
            VouchUsage["GET /usage"]
            VouchEffect["GET /effectiveness"]
            %% VouchTypePop["GET /type-popularity"] %% (Optional, can be derived)
        end

        subgraph "Reviews (/stats/reviews)"
            RevSumm["GET /summary"]
            RevDist["GET /rating-distribution"]
            RevByProd["GET /by-product"]
        end
    end