// web/index.js
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import shopify from "./shopify.js";
import wishlistRouter from "./routes/wishlist.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

export const prisma = new PrismaClient();

const app = express();
app.use(express.json());

// Shopify Auth Routes
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// Webhooks
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// CORS for frontend extension calls
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Shopify-Customer-Token");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/wishlist", wishlistRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// Admin API endpoint - get all wishlists for shop
app.get(
  "/api/admin/wishlists",
  shopify.validateAuthenticatedSession(),
  async (req, res) => {
    try {
      const session = res.locals.shopify.session;
      const wishlists = await prisma.wishlist.findMany({
        where: { shop: session.shop },
        orderBy: { createdAt: "desc" },
      });
      const grouped = {};
      wishlists.forEach((item) => {
        if (!grouped[item.customerId]) grouped[item.customerId] = [];
        grouped[item.customerId].push(item);
      });
      res.json({ success: true, data: grouped, total: wishlists.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Frontend
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT, () => {
  console.log(`✅ Wishlist App running on port ${PORT}`);
});
