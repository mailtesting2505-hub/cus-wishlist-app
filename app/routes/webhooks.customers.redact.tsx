import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop, payload } = await authenticate.webhook(request);
  const customerId = String((payload as any)?.customer?.id || (payload as any)?.customer_id || "");
  if (customerId) {
    await prisma.wishlistItem.deleteMany({ where: { shop, customerId } });
  }
  return new Response();
}
