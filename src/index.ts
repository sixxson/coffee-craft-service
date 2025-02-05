import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import subcategoryRoutes from "./routes/subcategory.routes";
import brandRoutes from "./routes/brand.routes";

import dashboardRoutes from "./routes/dashboardRoutes";
import productsRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoutes";

import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import helmet from "helmet";
import morgan from "morgan";

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: [
    "https://coffee-craft-admin-portal.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(cors());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("common"));

// Routes
app.use("/product-service/products", productRoutes);
app.use("/product-service/categories", categoryRoutes);
app.use("/product-service/subcategories", subcategoryRoutes);
app.use("/product-service/brands", brandRoutes);

app.use("/home", dashboardRoutes);
app.use("/products", productsRoutes);
app.use("/users", userRoutes);
app.use("/expenses", expenseRoutes);

// Error Handling Middleware
app.use(errorHandlerMiddleware);

// Database Connection
// connectDB();

// Server
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});

export default app;
