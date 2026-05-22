// web/routes/wishlist.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify customer token (from Shopify storefront)
const verifyCustomer = (req, res, next) => {
  const shop = req.headers["x-shopify-shop"] || req.query.shop;
  const customerId = req.headers["x-customer-id"] || req.query.customerId;
  
  if (!shop) {
    return res.status(400).json({ success: false, error: "Shop required" });
  }
  
  req.shop = shop;
  req.customerId = customerId || "guest";
  next();
};

// GET /api/wishlist - Get customer's wishlist
router.get("/", verifyCustomer, async (req, res) => {
  try {
    const { shop, customerId } = req;
    
    if (customerId === "guest") {
      return res.json({ success: true, data: [], isGuest: true });
    }

    const items = await prisma.wishlist.findMany({
      where: { shop, customerId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    console.error("GET wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/wishlist - Add product to wishlist
router.post("/", verifyCustomer, async (req, res) => {
  try {
    const { shop, customerId } = req;
    const { productId, variantId, productTitle, productImage, productPrice, productHandle } = req.body;

    if (!productId || !productTitle) {
      return res.status(400).json({ success: false, error: "productId and productTitle required" });
    }

    if (customerId === "guest") {
      return res.status(401).json({ 
        success: false, 
        error: "Login required to save wishlists",
        requireLogin: true 
      });
    }

    const item = await prisma.wishlist.upsert({
      where: {
        customerId_shop_productId: { customerId, shop, productId },
      },
      create: {
        customerId,
        shop,
        productId,
        variantId,
        productTitle,
        productImage,
        productPrice,
        productHandle,
      },
      update: {
        variantId,
        productPrice,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, data: item, message: "Added to wishlist!" });
  } catch (err) {
    console.error("POST wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete("/:productId", verifyCustomer, async (req, res) => {
  try {
    const { shop, customerId } = req;
    const { productId } = req.params;

    if (customerId === "guest") {
      return res.status(401).json({ success: false, error: "Login required" });
    }

    await prisma.wishlist.deleteMany({
      where: { customerId, shop, productId },
    });

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    console.error("DELETE wishlist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get("/check/:productId", verifyCustomer, async (req, res) => {
  try {
    const { shop, customerId } = req;
    const { productId } = req.params;

    if (customerId === "guest") {
      return res.json({ success: true, inWishlist: false, isGuest: true });
    }

    const item = await prisma.wishlist.findUnique({
      where: {
        customerId_shop_productId: { customerId, shop, productId },
      },
    });

    res.json({ success: true, inWishlist: !!item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/wishlist/count - Get wishlist count
router.get("/count", verifyCustomer, async (req, res) => {
  try {
    const { shop, customerId } = req;

    if (customerId === "guest") {
      return res.json({ success: true, count: 0 });
    }

    const count = await prisma.wishlist.count({
      where: { shop, customerId },
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
