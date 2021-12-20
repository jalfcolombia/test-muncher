/*
  Warnings:

  - You are about to drop the column `paid` on the `PurchaseOrderDetail` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseOrderDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prurchaseOrder" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "hashTransaction" TEXT,
    "transactionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderDetail_prurchaseOrder_fkey" FOREIGN KEY ("prurchaseOrder") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrderDetail" ("createdAt", "hashTransaction", "id", "productId", "prurchaseOrder", "quantity", "transactionAt") SELECT "createdAt", "hashTransaction", "id", "productId", "prurchaseOrder", "quantity", "transactionAt" FROM "PurchaseOrderDetail";
DROP TABLE "PurchaseOrderDetail";
ALTER TABLE "new_PurchaseOrderDetail" RENAME TO "PurchaseOrderDetail";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
