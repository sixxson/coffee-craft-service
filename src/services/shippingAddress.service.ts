import { PrismaClient, ShippingAddress } from '@prisma/client';

const prisma = new PrismaClient();

export const createShippingAddress = async (
  userId: string,
  data: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ShippingAddress> => {
  return prisma.shippingAddress.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const getShippingAddressesByUserId = async (
  userId: string
): Promise<ShippingAddress[]> => {
  return prisma.shippingAddress.findMany({
    where: { userId },
  });
};

export const getShippingAddressById = async (
  id: string,
  userId: string // Ensure user owns the address
): Promise<ShippingAddress | null> => {
  return prisma.shippingAddress.findUnique({
    where: { id, userId },
  });
};

export const updateShippingAddress = async (
  id: string,
  userId: string, // Ensure user owns the address
  data: Partial<Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<ShippingAddress | null> => {
  // First, verify the address exists and belongs to the user
  const existingAddress = await prisma.shippingAddress.findUnique({
    where: { id, userId },
  });

  if (!existingAddress) {
    return null; // Or throw an error
  }

  return prisma.shippingAddress.update({
    where: { id },
    data,
  });
};

export const deleteShippingAddress = async (
  id: string,
  userId: string // Ensure user owns the address
): Promise<ShippingAddress | null> => {
   // First, verify the address exists and belongs to the user
   const existingAddress = await prisma.shippingAddress.findUnique({
    where: { id, userId },
  });

  if (!existingAddress) {
    return null; // Or throw an error
  }

  return prisma.shippingAddress.delete({
    where: { id },
  });
};
