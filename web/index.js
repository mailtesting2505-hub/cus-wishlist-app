import express from "express";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// GET wishlist
app.get("/api/wishlist", async (req, res) => {
  try {
    const shop = req.headers["x-shopify-shop"] || req.query.shop;
    const customerId = req.headers["x-customer-id"] || req.query.customerId;
    if (!shop || !customerId || customerId === "") return res.json({ success: true, data: [], isGuest: true });
    const items = await prisma.wishlist.findMany({ where: { shop, customerId }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items, count: items.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST wishlist
app.post("/api/wishlist", async (req, res) => {
  try {
    const shop = req.headers["x-shopify-shop"];
    const customerId = req.headers["x-customer-id"];
    if (!customerId) return res.status(401).json({ success: false, error: "Login required", requireLogin: true });
    const { productId, variantId, productTitle, productImage, productPrice, productHandle } = req.body;
    const item = await prisma.wishlist.upsert({
      where: { customerId_shop_productId: { customerId, shop, productId } },
      create: { customerId, shop, productId, variantId, productTitle, productImage, productPrice, productHandle },
      update: { variantId, productPrice, updatedAt: new Date() },
    });
    res.json({ success: true, data: item, message: "Added to wishlist!" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE wishlist
app.delete("/api/wishlist/:productId", async (req, res) => {
  try {
    const shop = req.headers["x-shopify-shop"];
    const customerId = req.headers["x-customer-id"];
    const { productId } = req.params;
    await prisma.wishlist.deleteMany({ where: { customerId, shop, productId } });
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// CHECK wishlist
app.get("/api/wishlist/check/:productId", async (req, res) => {
  try {
    const shop = req.headers["x-shopify-shop"];
    const customerId = req.headers["x-customer-id"];
    const { productId } = req.params;
    if (!customerId) return res.json({ success: true, inWishlist: false });
    const item = await prisma.wishlist.findUnique({ where: { customerId_shop_productId: { customerId, shop, productId } } });
    res.json({ success: true, inWishlist: !!item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// COUNT wishlist
app.get("/api/wishlist/count", async (req, res) => {
  try {
    const shop = req.headers["x-shopify-shop"];
    const customerId = req.headers["x-customer-id"];
    if (!customerId) return res.json({ success: true, count: 0 });
    const count = await prisma.wishlist.count({ where: { shop, customerId } });
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Admin - all wishlists
app.get("/api/admin/wishlists", async (req, res) => {
  try {
    const shop = req.query.shop;
    const wishlists = await prisma.wishlist.findMany({ where: shop ? { shop } : {}, orderBy: { createdAt: "desc" } });
    const grouped = {};
    wishlists.forEach((item) => { if (!grouped[item.customerId]) grouped[item.customerId] = []; grouped[item.customerId].push(item); });
    res.json({ success: true, data: grouped, total: wishlists.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, () => console.log("Cus Wishlist App running on port " + PORT));
