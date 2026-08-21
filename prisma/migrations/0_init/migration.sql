-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistSettings" (
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "guestWishlist" BOOLEAN NOT NULL DEFAULT true,
    "loginRequired" BOOLEAN NOT NULL DEFAULT false,
    "mergeGuestOnLogin" BOOLEAN NOT NULL DEFAULT true,
    "productButtonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "collectionButtonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "buttonText" TEXT NOT NULL DEFAULT 'Add to wishlist',
    "buttonAddedText" TEXT NOT NULL DEFAULT 'Wishlisted',
    "primaryColor" TEXT NOT NULL DEFAULT '#17130F',
    "activeColor" TEXT NOT NULL DEFAULT '#D92D20',
    "iconSize" INTEGER NOT NULL DEFAULT 22,
    "buttonRadius" INTEGER NOT NULL DEFAULT 8,
    "floatingLauncherEnabled" BOOLEAN NOT NULL DEFAULT true,
    "headerCounterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "launcherPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "pageTitle" TEXT NOT NULL DEFAULT 'My Wishlist',
    "emptyText" TEXT NOT NULL DEFAULT 'Your wishlist is empty.',
    "pageHandle" TEXT NOT NULL DEFAULT 'wishlist',
    "columnsDesktop" INTEGER NOT NULL DEFAULT 4,
    "columnsMobile" INTEGER NOT NULL DEFAULT 2,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showVariant" BOOLEAN NOT NULL DEFAULT true,
    "showAddToCart" BOOLEAN NOT NULL DEFAULT true,
    "showRemove" BOOLEAN NOT NULL DEFAULT true,
    "toastEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customProductSelector" TEXT NOT NULL DEFAULT '',
    "customCardSelector" TEXT NOT NULL DEFAULT '',
    "customHeaderSelector" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistSettings_pkey" PRIMARY KEY ("shop")
);

-- CreateIndex
CREATE INDEX "WishlistItem_shop_customerId_idx" ON "WishlistItem"("shop", "customerId");

-- CreateIndex
CREATE INDEX "WishlistItem_shop_productId_idx" ON "WishlistItem"("shop", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shop_customerId_productId_variantId_key" ON "WishlistItem"("shop", "customerId", "productId", "variantId");

