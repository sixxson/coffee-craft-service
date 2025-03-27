import { Router } from 'express';
import * as shippingAddressController from '../controllers/shippingAddress.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequestBody } from '../middlewares/validation.middleware';
import {
  createShippingAddressSchema,
  updateShippingAddressSchema,
} from '../validations/shippingAddress.validation';

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(authenticate); // Apply authentication to all routes first

// Routes for Shipping Addresses
router.post(
  '/',
  validateRequestBody(createShippingAddressSchema), // Validate request body on create
  shippingAddressController.createAddress
);
router.get('/', shippingAddressController.getAddresses);
router.get('/:id', shippingAddressController.getAddressById); // Optional: Add param validation if needed
router.put(
  '/:id',
  validateRequestBody(updateShippingAddressSchema), // Validate request body on update
  shippingAddressController.updateAddress
);
router.delete('/:id', shippingAddressController.deleteAddress); // Optional: Add param validation if needed

export default router;
