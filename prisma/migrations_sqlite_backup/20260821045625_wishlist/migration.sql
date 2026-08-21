-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "image" TEXT,
    "price" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "primaryColor" TEXT NOT NULL DEFAULT '#17130F',
    "pageTitle" TEXT NOT NULL DEFAULT 'My Wishlist',
    "emptyText" TEXT NOT NULL DEFAULT 'Your wishlist is empty.',
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "WishlistItem_shop_customerId_idx" ON "WishlistItem"("shop", "customerId");

-- CreateIndex
CREATE INDEX "WishlistItem_shop_productId_idx" ON "WishlistItem"("shop", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shop_customerId_productId_variantId_key" ON "WishlistItem"("shop", "customerId", "productId", "variantId");
