import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import productRoutes from './routes/product.routes';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Error Handling Middleware
app.use(errorHandlerMiddleware);

// Database Connection
connectDB();

export default app;
