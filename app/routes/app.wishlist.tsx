import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getSettings, updateSettings } from "../services/wishlist.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, totalItems, uniqueCustomers] = await Promise.all([
    getSettings(shop),
    prisma.wishlistItem.count({ where: { shop } }),
    prisma.wishlistItem.groupBy({ by: ["customerId"], where: { shop } }),
  ]);

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const embedLink = `https://${shop}/admin/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/wishlist-embed`;
  const productBlockLink = `https://${shop}/admin/themes/current/editor?template=product&addAppBlockId=${apiKey}/product-wishlist-button&target=mainSection`;
  const wishlistPageBlockLink = `https://${shop}/admin/themes/current/editor?template=page&addAppBlockId=${apiKey}/wishlist-page&target=newAppsSection`;

  return {
    shop,
    settings,
    totalItems,
    uniqueCustomers: uniqueCustomers.length,
    embedLink,
    productBlockLink,
    wishlistPageBlockLink,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  if (intent === "create-page") {
    const response = await admin.graphql(
      `#graphql
        mutation CreateWishlistPage($page: PageCreateInput!) {
          pageCreate(page: $page) {
            page { id title handle }
            userErrors { field message code }
          }
        }
      `,
      {
        variables: {
          page: {
            title: "Wishlist",
            handle: "wishlist",
            body: "",
            isPublished: true,
          },
        },
      },
    );
    const result = await response.json();
    const errors = result?.data?.pageCreate?.userErrors || [];
    const page = result?.data?.pageCreate?.page;

    if (errors.length) {
      const duplicate = errors.some((e: any) =>
        String(e.message || "").toLowerCase().includes("handle"),
      );
      if (!duplicate) return { ok: false, message: errors.map((e: any) => e.message).join(", ") };
    }

    return {
      ok: true,
      message: page ? "Wishlist page created." : "Wishlist page already exists or handle is in use.",
    };
  }

  await updateSettings(session.shop, {
    primaryColor: String(form.get("primaryColor") || "#17130F"),
    pageTitle: String(form.get("pageTitle") || "My Wishlist"),
    emptyText: String(form.get("emptyText") || "Your wishlist is empty."),
    showPrices: form.get("showPrices") === "on",
    showAddToCart: form.get("showAddToCart") === "on",
  });

  return { ok: true, message: "Wishlist settings saved." };
}

export default function WishlistAdmin() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Custom Wishlist">
      <s-stack direction="block" gap="base">
        {actionData?.message ? (
          <s-banner tone={actionData.ok ? "success" : "critical"}>
            {actionData.message}
          </s-banner>
        ) : null}

        <s-section heading="Overview">
          <s-stack direction="inline" gap="base">
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-text>Total saved items: {data.totalItems}</s-text>
            </s-box>
            <s-box padding="base" borderWidth="base" borderRadius="base">
              <s-text>Customers with wishlists: {data.uniqueCustomers}</s-text>
            </s-box>
          </s-stack>
        </s-section>

        <s-section heading="Theme setup">
          <s-paragraph>
            Enable the global embed first. Then add the product button and the wishlist page block.
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-button href={data.embedLink} target="_top">Enable wishlist embed</s-button>
            <s-button href={data.productBlockLink} target="_top" variant="secondary">Add product heart</s-button>
            <s-button href={data.wishlistPageBlockLink} target="_top" variant="secondary">Add wishlist page block</s-button>
          </s-stack>
          <br />
          <Form method="post">
            <input type="hidden" name="intent" value="create-page" />
            <s-button type="submit" variant="secondary">Create /pages/wishlist</s-button>
          </Form>
        </s-section>

        <s-section heading="Storefront settings">
          <Form method="post">
            <input type="hidden" name="intent" value="save" />
            <div style={{ display: "grid", gap: 16, maxWidth: 620 }}>
              <label>
                <div style={{ marginBottom: 6 }}>Primary color</div>
                <input type="color" name="primaryColor" defaultValue={data.settings.primaryColor} />
              </label>
              <label>
                <div style={{ marginBottom: 6 }}>Wishlist page title</div>
                <input name="pageTitle" defaultValue={data.settings.pageTitle} style={{ width: "100%", padding: 10 }} />
              </label>
              <label>
                <div style={{ marginBottom: 6 }}>Empty wishlist message</div>
                <input name="emptyText" defaultValue={data.settings.emptyText} style={{ width: "100%", padding: 10 }} />
              </label>
              <label><input type="checkbox" name="showPrices" defaultChecked={data.settings.showPrices} /> Show prices</label>
              <label><input type="checkbox" name="showAddToCart" defaultChecked={data.settings.showAddToCart} /> Show Add to Cart</label>
              <s-button type="submit">Save settings</s-button>
            </div>
          </Form>
        </s-section>

        <s-section heading="How customer data works">
          <s-paragraph>
            Guests are saved in the browser. Logged-in customer wishlists are stored in your app database and guest items are merged after login.
          </s-paragraph>
        </s-section>
      </s-stack>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
