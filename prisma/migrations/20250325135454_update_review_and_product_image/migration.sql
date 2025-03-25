-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "imgUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
