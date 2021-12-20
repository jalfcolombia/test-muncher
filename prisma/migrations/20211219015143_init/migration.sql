-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Product" ("id", "name", "price", "reference") SELECT "id", "name", "price", "reference" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_reference_key" ON "Product"("reference");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
