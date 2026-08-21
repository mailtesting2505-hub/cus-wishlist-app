import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  addWishlistItem,
  clearWishlist,
  getSettings,
  getWishlist,
  mergeWishlist,
  removeWishlistItem,
} from "../services/wishlist.server";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
    },
  });
}

function identity(request: Request) {
  const url = new URL(request.url);
  return {
    shop: url.searchParams.get("shop") || "",
    customerId: url.searchParams.get("logged_in_customer_id") || "",
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);
  const { shop, customerId } = identity(request);
  const url = new URL(request.url);
  const op = url.searchParams.get("op") || "list";

  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);

  if (op === "settings") {
    const settings = await getSettings(shop);
    return json({ ok: true, settings });
  }

  if (!customerId) {
    return json({ ok: true, authenticated: false, items: [] });
  }

  const items = await getWishlist(shop, customerId);
  return json({ ok: true, authenticated: true, items });
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.public.appProxy(request);
  const { shop, customerId } = identity(request);

  if (!shop) return json({ ok: false, error: "Missing shop" }, 400);
  if (!customerId) {
    return json({ ok: false, authenticated: false, error: "Customer is not logged in." }, 401);
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const op = String(body.op || "");

  if (op === "add") {
    const item = body.item;
    if (!item?.productId || !item?.variantId || !item?.handle || !item?.title) {
      return json({ ok: false, error: "Missing wishlist item fields" }, 422);
    }
    await addWishlistItem(shop, customerId, item);
  } else if (op === "remove") {
    if (!body.productId) return json({ ok: false, error: "Missing productId" }, 422);
    await removeWishlistItem(
      shop,
      customerId,
      String(body.productId),
      body.variantId ? String(body.variantId) : undefined,
    );
  } else if (op === "clear") {
    await clearWishlist(shop, customerId);
  } else if (op === "merge") {
    await mergeWishlist(shop, customerId, Array.isArray(body.items) ? body.items : []);
  } else {
    return json({ ok: false, error: "Unknown operation" }, 400);
  }

  const items = await getWishlist(shop, customerId);
  return json({ ok: true, authenticated: true, items });
}
