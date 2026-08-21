-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WishlistSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WishlistSettings" ("createdAt", "emptyText", "pageTitle", "primaryColor", "shop", "showAddToCart", "showPrices", "updatedAt") SELECT "createdAt", "emptyText", "pageTitle", "primaryColor", "shop", "showAddToCart", "showPrices", "updatedAt" FROM "WishlistSettings";
DROP TABLE "WishlistSettings";
ALTER TABLE "new_WishlistSettings" RENAME TO "WishlistSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
