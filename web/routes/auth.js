// web/routes/auth.js
import express from "express";

const router = express.Router();

// This returns the Shopify multipass or account login URL
// Customers login via Shopify's native account system
router.get("/login-url", (req, res) => {
  const { shop, returnUrl } = req.query;
  if (!shop) return res.status(400).json({ error: "shop required" });

  const loginUrl = `https://${shop}/account/login?return_url=${encodeURIComponent(returnUrl || "/pages/wishlist")}`;
  res.json({ success: true, loginUrl });
});

router.get("/signup-url", (req, res) => {
  const { shop, returnUrl } = req.query;
  if (!shop) return res.status(400).json({ error: "shop required" });

  const signupUrl = `https://${shop}/account/register?return_url=${encodeURIComponent(returnUrl || "/pages/wishlist")}`;
  res.json({ success: true, signupUrl });
});

export default router;
