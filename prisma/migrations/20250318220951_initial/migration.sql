/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `correctName` on the `TrainingData` table. All the data in the column will be lost.
  - You are about to drop the column `detectedName` on the `TrainingData` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `TrainingData` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TrainingData` table. All the data in the column will be lost.
  - Added the required column `bboxHeight` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bboxWidth` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bboxX` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bboxY` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detectedAs` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemName` to the `TrainingData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `TrainingData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "imageData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("confidence", "createdAt", "id", "name", "userId") SELECT "confidence", "createdAt", "id", "name", "userId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_TrainingData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "bboxX" REAL NOT NULL,
    "bboxY" REAL NOT NULL,
    "bboxWidth" REAL NOT NULL,
    "bboxHeight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "confidence" REAL NOT NULL,
    "detectedAs" TEXT NOT NULL,
    CONSTRAINT "TrainingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrainingData" ("confidence", "createdAt", "id", "imageData") SELECT "confidence", "createdAt", "id", "imageData" FROM "TrainingData";
DROP TABLE "TrainingData";
ALTER TABLE "new_TrainingData" RENAME TO "TrainingData";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
