import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes";

import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

// Routes
app.use("/product-service/products", productRoutes);
// app.use("/product-service/dashboard", dashboardRoutes);
// app.use("/product-service/users", userRoutes);
// app.use("/product-service/expenses", expenseRoutes);


// Error Handling Middleware
app.use(errorHandlerMiddleware);

// Database Connection
// connectDB();

// Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});

export default app;
