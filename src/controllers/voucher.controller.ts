import { Request, Response, RequestHandler } from "express";
import * as voucherService from "../services/voucher.service";

// Get all vouchers
export const getVouchers: RequestHandler = async (req, res): Promise<void> => {
  try {
    const result = await voucherService.getAllVouchers(req.query);
    res.json(result); // Sends { data: vouchers[], total: number }
  } catch (error: any) {
    console.error("Error fetching vouchers:", error);
    res.status(500).json({ error: "Failed to fetch vouchers", message: error.message });
  }
};

// Get a single voucher by ID
export const getVoucher: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.getVoucherById(id);

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    res.json(voucher);
  } catch (error: any) {
    console.error("Error fetching voucher:", error);
    res.status(500).json({ error: "Failed to fetch voucher", message: error.message });
  }
};

// Get a single voucher by Code
export const getVoucherByCodeHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { code } = req.params;
    const voucher = await voucherService.getVoucherByCode(code);

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    res.json(voucher);
  } catch (error: any) {
    console.error("Error fetching voucher by code:", error);
    res.status(500).json({ error: "Failed to fetch voucher by code", message: error.message });
  }
};


// Create a new voucher
export const createVoucherHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    res.status(201).json(voucher);
  } catch (error: any) {
     console.error("Error creating voucher:", error);
     const statusCode = error.statusCode || 400;
     res.status(statusCode).json({ error: "Failed to create voucher", message: error.message });
  }
};

// Update an existing voucher
export const updateVoucherHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.updateVoucher(id, req.body);

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    res.json(voucher);
  } catch (error: any) {
    console.error("Error updating voucher:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to update voucher", message: error.message });
  }
};

// Delete a voucher
export const deleteVoucherHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedVoucher = await voucherService.deleteVoucher(id);

     if (!deletedVoucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    // Successfully deleted
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting voucher:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to delete voucher", message: error.message });
  }
};
