import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import userRoutes from "./routes/user.routes";

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
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/brands", brandRoutes);
app.use("/users", userRoutes);

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
