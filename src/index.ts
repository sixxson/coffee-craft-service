import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import userRoutes from "./routes/user.routes";

import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/brands", brandRoutes);
app.use("/users", userRoutes);

// Error Handling Middleware
app.use(errorHandlerMiddleware);

// Server
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});

export default app;
