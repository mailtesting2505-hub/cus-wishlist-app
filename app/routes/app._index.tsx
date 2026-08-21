import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getSettings } from "../services/wishlist.server";

const styles = "\n:root{--cw-border:#e3e3e3;--cw-muted:#616161;--cw-card:#fff}\n.cw-wrap{max-width:1180px;margin:0 auto;padding:8px 0 28px}.cw-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}\n.cw-two{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.75fr);gap:18px}.cw-card{background:var(--cw-card);border:1px solid var(--cw-border);border-radius:14px;padding:20px;box-shadow:0 1px 0 rgba(0,0,0,.03)}\n.cw-stat strong{display:block;font-size:28px;line-height:1.15;margin-top:10px}.cw-stat span{font-size:13px;color:var(--cw-muted)}.cw-title{font-size:20px;font-weight:650;margin:0 0 5px}.cw-muted{color:var(--cw-muted)}\n.cw-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.cw-gap{display:grid;gap:14px}.cw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:8px;border:1px solid #8a8a8a;background:#fff;color:#202223;text-decoration:none;font-weight:600;cursor:pointer}\n.cw-btn-primary{background:#303030;color:#fff;border-color:#303030}.cw-pill{display:inline-flex;border-radius:999px;padding:4px 9px;background:#eaf7ef;color:#087a3f;font-size:12px;font-weight:650}.cw-progress{height:8px;background:#eee;border-radius:10px;overflow:hidden}.cw-progress>i{display:block;height:100%;background:#303030;border-radius:10px}\n.cw-table{width:100%;border-collapse:collapse}.cw-table th,.cw-table td{padding:12px 10px;border-bottom:1px solid #eee;text-align:left;font-size:14px}.cw-table th{color:#616161;font-weight:600}.cw-product{display:flex;align-items:center;gap:10px}.cw-product img{width:42px;height:42px;border-radius:8px;object-fit:cover;background:#f1f1f1}\n.cw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.cw-field{display:grid;gap:6px}.cw-field label{font-size:13px;font-weight:650}.cw-input,.cw-select{width:100%;box-sizing:border-box;border:1px solid #8a8a8a;border-radius:8px;padding:10px 11px;background:#fff;font:inherit}\n.cw-check{display:flex;align-items:flex-start;gap:10px}.cw-check input{margin-top:3px}.cw-check b{display:block;font-size:14px}.cw-check small{display:block;color:#616161;margin-top:2px}.cw-section-title{font-size:17px;font-weight:700;margin:0}.cw-preview{background:#f4f4f4;border-radius:14px;padding:18px;min-height:280px}\n.cw-preview-card{background:#fff;border-radius:12px;border:1px solid #ddd;padding:16px}.cw-preview-img{height:150px;border-radius:9px;background:linear-gradient(135deg,#ececec,#fafafa);display:grid;place-items:center;color:#8a8a8a}.cw-heart-demo{margin-top:12px;width:100%;padding:11px;border:1px solid #333;border-radius:8px;background:#fff;font-weight:650}\n.cw-bar{display:flex;align-items:center;gap:10px}.cw-bar-track{height:9px;border-radius:10px;background:#eee;flex:1;overflow:hidden}.cw-bar-track i{display:block;height:100%;background:#303030}.cw-note{padding:12px 14px;border-radius:10px;background:#f1f8ff;border:1px solid #c9e3ff;font-size:13px}\n@media(max-width:900px){.cw-grid{grid-template-columns:repeat(2,1fr)}.cw-two{grid-template-columns:1fr}.cw-form-grid{grid-template-columns:1fr}}@media(max-width:560px){.cw-grid{grid-template-columns:1fr}.cw-card{padding:16px}}\n";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, items] = await Promise.all([
    getSettings(shop),
    prisma.wishlistItem.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
  ]);

  const customers = new Set(items.map((item) => item.customerId));
  const now = Date.now();
  const last7 = items.filter(
    (item) => now - new Date(item.createdAt).getTime() <= 7 * 86400000,
  ).length;

  const productMap = new Map<
    string,
    { productId: string; title: string; image: string | null; handle: string; count: number }
  >();

  for (const item of items) {
    const current = productMap.get(item.productId);
    if (current) current.count += 1;
    else productMap.set(item.productId, {
      productId: item.productId,
      title: item.title,
      image: item.image,
      handle: item.handle,
      count: 1,
    });
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const embedLink =
    `https://${shop}/admin/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/wishlist-embed`;

  return {
    shop,
    settings,
    stats: {
      totalItems: items.length,
      customers: customers.size,
      last7,
      products: productMap.size,
    },
    topProducts,
    embedLink,
    wishlistUrl: `https://${shop}/pages/${settings.pageHandle}`,
  };
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  const setupScore =
    (data.settings.enabled ? 34 : 0) +
    (data.settings.productButtonEnabled ? 33 : 0) +
    (data.settings.pageHandle ? 33 : 0);

  return (
    <s-page heading="Wishlist dashboard">
      <style>{styles}</style>

      <div className="cw-wrap cw-gap">
        <div className="cw-row">
          <div>
            <div className="cw-title">Store wishlist overview</div>
            <div className="cw-muted">
              Manage behavior, styling and customer wishlists from this app.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="cw-btn" href="/app/settings">Customize</a>
            <a className="cw-btn cw-btn-primary" href={data.embedLink} target="_top">
              Enable app embed
            </a>
          </div>
        </div>

        <div className="cw-grid">
          <div className="cw-card cw-stat"><span>Total saved items</span><strong>{data.stats.totalItems}</strong></div>
          <div className="cw-card cw-stat"><span>Customers with wishlists</span><strong>{data.stats.customers}</strong></div>
          <div className="cw-card cw-stat"><span>Saves in last 7 days</span><strong>{data.stats.last7}</strong></div>
          <div className="cw-card cw-stat"><span>Products wishlisted</span><strong>{data.stats.products}</strong></div>
        </div>

        <div className="cw-two">
          <div className="cw-card cw-gap">
            <div className="cw-row">
              <div>
                <h2 className="cw-section-title">Top wishlisted products</h2>
                <div className="cw-muted">Based on saved customer wishlist items.</div>
              </div>
              <a className="cw-btn" href="/app/analytics">View analytics</a>
            </div>

            {data.topProducts.length ? (
              <table className="cw-table">
                <thead><tr><th>Product</th><th>Saves</th></tr></thead>
                <tbody>
                  {data.topProducts.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <div className="cw-product">
                          {product.image ? <img src={product.image} alt="" /> : null}
                          <span>{product.title}</span>
                        </div>
                      </td>
                      <td><b>{product.count}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="cw-note">
                No wishlist activity yet. Enable the storefront integration and test a product.
              </div>
            )}
          </div>

          <div className="cw-card cw-gap">
            <div className="cw-row">
              <h2 className="cw-section-title">Setup</h2>
              <span className="cw-pill">{setupScore}% ready</span>
            </div>

            <div className="cw-progress">
              <i style={{ width: `${setupScore}%` }} />
            </div>

            <div className="cw-gap">
              <div>
                <b>1. App enabled</b>
                <div className="cw-muted">
                  {data.settings.enabled ? "Enabled in app settings." : "Turn it on in General settings."}
                </div>
              </div>

              <div>
                <b>2. Enable global App Embed</b>
                <div className="cw-muted">One global embed only. No product/page blocks are required.</div>
              </div>

              <div>
                <b>3. Create wishlist page</b>
                <div className="cw-muted">Use Settings → Wishlist page → Create page.</div>
              </div>
            </div>

            <a className="cw-btn cw-btn-primary" href="/app/settings">Finish setup</a>
            <a className="cw-btn" href={data.wishlistUrl} target="_blank" rel="noreferrer">
              Open storefront wishlist
            </a>
          </div>
        </div>

        <div className="cw-card">
          <div className="cw-title">No product or page app blocks</div>
          <div className="cw-muted">
            Product hearts, collection hearts, wishlist page content and optional launcher
            are injected automatically by the single global App Embed. All customization
            lives here inside the app.
          </div>
        </div>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
