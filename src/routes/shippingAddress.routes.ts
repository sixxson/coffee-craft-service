import { Router } from 'express';
import * as shippingAddressController from '../controllers/shippingAddress.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequestBody } from '../middlewares/validation.middleware';
import {
  createShippingAddressSchema,
  updateShippingAddressSchema,
} from '../validations/shippingAddress.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shipping Addresses
 *   description: Management of user shipping addresses
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingAddress: # Already defined in Order routes, ensure consistency or use $ref
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         address:
 *           type: string
 *         receiverName:
 *           type: string
 *         receiverPhone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ShippingAddressInput:
 *       type: object
 *       required:
 *         - address
 *         - receiverName
 *         - receiverPhone
 *       properties:
 *         address:
 *           type: string
 *         receiverName:
 *           type: string
 *         receiverPhone:
 *           type: string
 */

// Apply authentication middleware to all routes in this file
router.use(authenticate);

/**
 * @swagger
 * /shipping-addresses:
 *   post:
 *     summary: Create a new shipping address for the authenticated user
 *     tags: [Shipping Addresses]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShippingAddressInput'
 *     responses:
 *       201:
 *         description: Shipping address created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 */
router.post(
  '/',
  validateRequestBody(createShippingAddressSchema),
  shippingAddressController.createAddress
);

/**
 * @swagger
 * /shipping-addresses:
 *   get:
 *     summary: Retrieve all shipping addresses for the authenticated user
 *     tags: [Shipping Addresses]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's shipping addresses.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *       401: { description: Unauthorized }
 */
router.get('/', shippingAddressController.getAddresses);

/**
 * @swagger
 * /shipping-addresses/{id}:
 *   get:
 *     summary: Retrieve a specific shipping address by ID
 *     tags: [Shipping Addresses]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the shipping address to retrieve
 *     responses:
 *       200:
 *         description: Shipping address details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (Address does not belong to user) }
 *       404: { description: Shipping address not found }
 */
router.get('/:id', shippingAddressController.getAddressById);

/**
 * @swagger
 * /shipping-addresses/{id}:
 *   put:
 *     summary: Update an existing shipping address
 *     tags: [Shipping Addresses]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the shipping address to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { type: string }
 *               receiverName: { type: string }
 *               receiverPhone: { type: string }
 *     responses:
 *       200:
 *         description: Shipping address updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (Address does not belong to user) }
 *       404: { description: Shipping address not found }
 */
router.put(
  '/:id',
  validateRequestBody(updateShippingAddressSchema),
  shippingAddressController.updateAddress
);

/**
 * @swagger
 * /shipping-addresses/{id}:
 *   delete:
 *     summary: Delete a shipping address
 *     tags: [Shipping Addresses]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the shipping address to delete
 *     responses:
 *       204: { description: Shipping address deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (Address does not belong to user) }
 *       404: { description: Shipping address not found }
 *       409: { description: Conflict (Address is used in an order) }
 */
router.delete('/:id', shippingAddressController.deleteAddress);

export default router;
