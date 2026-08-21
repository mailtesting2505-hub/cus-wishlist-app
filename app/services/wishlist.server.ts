import prisma from "../db.server";

export type WishlistPayload = {
  productId: string;
  variantId: string;
  handle: string;
  title: string;
  variantTitle?: string | null;
  image?: string | null;
  price?: string | null;
  url: string;
};

export const defaultWishlistSettings = {
  enabled: true,
  guestWishlist: true,
  loginRequired: false,
  mergeGuestOnLogin: true,

  productButtonEnabled: true,
  collectionButtonEnabled: true,
  buttonText: "Add to wishlist",
  buttonAddedText: "Wishlisted",
  primaryColor: "#17130F",
  activeColor: "#D92D20",
  iconSize: 22,
  buttonRadius: 8,

  floatingLauncherEnabled: true,
  headerCounterEnabled: true,
  launcherPosition: "bottom-right",

  pageTitle: "My Wishlist",
  emptyText: "Your wishlist is empty.",
  pageHandle: "wishlist",
  columnsDesktop: 4,
  columnsMobile: 2,
  showPrices: true,
  showVariant: true,
  showAddToCart: true,
  showRemove: true,

  toastEnabled: true,

  customProductSelector: "",
  customCardSelector: "",
  customHeaderSelector: "",
};

export async function getWishlist(shop: string, customerId: string) {
  return prisma.wishlistItem.findMany({
    where: { shop, customerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addWishlistItem(
  shop: string,
  customerId: string,
  item: WishlistPayload,
) {
  return prisma.wishlistItem.upsert({
    where: {
      shop_customerId_productId_variantId: {
        shop,
        customerId,
        productId: String(item.productId),
        variantId: String(item.variantId),
      },
    },
    update: {
      handle: item.handle,
      title: item.title,
      variantTitle: item.variantTitle || null,
      image: item.image || null,
      price: item.price || null,
      url: item.url,
      updatedAt: new Date(),
    },
    create: {
      shop,
      customerId,
      productId: String(item.productId),
      variantId: String(item.variantId),
      handle: item.handle,
      title: item.title,
      variantTitle: item.variantTitle || null,
      image: item.image || null,
      price: item.price || null,
      url: item.url,
    },
  });
}

export async function removeWishlistItem(
  shop: string,
  customerId: string,
  productId: string,
  variantId?: string,
) {
  return prisma.wishlistItem.deleteMany({
    where: {
      shop,
      customerId,
      productId: String(productId),
      ...(variantId ? { variantId: String(variantId) } : {}),
    },
  });
}

export async function clearWishlist(shop: string, customerId: string) {
  return prisma.wishlistItem.deleteMany({ where: { shop, customerId } });
}

export async function mergeWishlist(
  shop: string,
  customerId: string,
  items: WishlistPayload[],
) {
  for (const item of items.slice(0, 250)) {
    if (!item?.productId || !item?.variantId || !item?.handle || !item?.title) continue;
    await addWishlistItem(shop, customerId, item);
  }
  return getWishlist(shop, customerId);
}

export async function getSettings(shop: string) {
  const current = await prisma.wishlistSettings.findUnique({ where: { shop } });
  if (current) return current;

  return prisma.wishlistSettings.create({
    data: { shop, ...defaultWishlistSettings },
  });
}

export type WishlistSettingsUpdate = Partial<typeof defaultWishlistSettings>;

export async function updateSettings(shop: string, data: WishlistSettingsUpdate) {
  return prisma.wishlistSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...defaultWishlistSettings, ...data },
  });
}
