import { Request, Response, NextFunction, RequestHandler } from 'express'; // Import RequestHandler
import * as shippingAddressService from '../services/shippingAddress.service';
import { Prisma, ShippingAddress } from '@prisma/client'; // Import Prisma and ShippingAddress type

// The Request interface is extended globally in auth.middleware.ts

export const createAddress: RequestHandler = async (req, res, next) => {
  try {
    // req.user is guaranteed by the authenticate middleware if next() is called
    const userId = req.user.id;

    // Validation is handled by the validateRequestBody middleware
    // req.body now contains the validated data
    const data: Prisma.ShippingAddressCreateWithoutUserInput = req.body;

    const newAddress = await shippingAddressService.createShippingAddress(userId, data);
    res.status(201).json(newAddress);
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
};

export const getAddresses: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await shippingAddressService.getShippingAddressesByUserId(userId);
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

export const getAddressById: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const address = await shippingAddressService.getShippingAddressById(id, userId);
    if (!address) {
      res.status(404).json({ message: 'Shipping address not found or access denied' });
      return; // Exit function after sending response
    }
    res.status(200).json(address);
  } catch (error) {
    next(error);
  }
};

export const updateAddress: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validation (including ensuring at least one field) is handled by the middleware.
    // req.body contains the validated fields to update.
    const dataToUpdate: Partial<Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = req.body;

    const updatedAddress = await shippingAddressService.updateShippingAddress(id, userId, dataToUpdate);
    if (!updatedAddress) {
      res.status(404).json({ message: 'Shipping address not found or access denied' });
      return; // Exit function after sending response
    }
    res.status(200).json(updatedAddress);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deletedAddress = await shippingAddressService.deleteShippingAddress(id, userId);
     if (!deletedAddress) {
      res.status(404).json({ message: 'Shipping address not found or access denied' });
      return; // Exit function after sending response
    }
    res.status(200).json({ message: 'Shipping address deleted successfully' }); // Or return 204 No Content
  } catch (error) {
    next(error);
  }
};
