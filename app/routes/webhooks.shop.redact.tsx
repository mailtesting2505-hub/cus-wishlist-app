import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop } = await authenticate.webhook(request);
  await prisma.wishlistItem.deleteMany({ where: { shop } });
  await prisma.wishlistSettings.deleteMany({ where: { shop } });
  return new Response();
}
