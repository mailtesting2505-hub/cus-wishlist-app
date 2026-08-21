import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    await prisma.session.deleteMany({ where: { shop } });
  }
  await prisma.wishlistItem.deleteMany({ where: { shop } });
  await prisma.wishlistSettings.deleteMany({ where: { shop } });

  return new Response();
}
