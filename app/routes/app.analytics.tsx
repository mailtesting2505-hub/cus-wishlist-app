import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const styles = "\n:root{--cw-border:#e3e3e3;--cw-muted:#616161;--cw-card:#fff}\n.cw-wrap{max-width:1180px;margin:0 auto;padding:8px 0 28px}.cw-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}\n.cw-two{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.75fr);gap:18px}.cw-card{background:var(--cw-card);border:1px solid var(--cw-border);border-radius:14px;padding:20px;box-shadow:0 1px 0 rgba(0,0,0,.03)}\n.cw-stat strong{display:block;font-size:28px;line-height:1.15;margin-top:10px}.cw-stat span{font-size:13px;color:var(--cw-muted)}.cw-title{font-size:20px;font-weight:650;margin:0 0 5px}.cw-muted{color:var(--cw-muted)}\n.cw-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.cw-gap{display:grid;gap:14px}.cw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:8px;border:1px solid #8a8a8a;background:#fff;color:#202223;text-decoration:none;font-weight:600;cursor:pointer}\n.cw-btn-primary{background:#303030;color:#fff;border-color:#303030}.cw-pill{display:inline-flex;border-radius:999px;padding:4px 9px;background:#eaf7ef;color:#087a3f;font-size:12px;font-weight:650}.cw-progress{height:8px;background:#eee;border-radius:10px;overflow:hidden}.cw-progress>i{display:block;height:100%;background:#303030;border-radius:10px}\n.cw-table{width:100%;border-collapse:collapse}.cw-table th,.cw-table td{padding:12px 10px;border-bottom:1px solid #eee;text-align:left;font-size:14px}.cw-table th{color:#616161;font-weight:600}.cw-product{display:flex;align-items:center;gap:10px}.cw-product img{width:42px;height:42px;border-radius:8px;object-fit:cover;background:#f1f1f1}\n.cw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.cw-field{display:grid;gap:6px}.cw-field label{font-size:13px;font-weight:650}.cw-input,.cw-select{width:100%;box-sizing:border-box;border:1px solid #8a8a8a;border-radius:8px;padding:10px 11px;background:#fff;font:inherit}\n.cw-check{display:flex;align-items:flex-start;gap:10px}.cw-check input{margin-top:3px}.cw-check b{display:block;font-size:14px}.cw-check small{display:block;color:#616161;margin-top:2px}.cw-section-title{font-size:17px;font-weight:700;margin:0}.cw-preview{background:#f4f4f4;border-radius:14px;padding:18px;min-height:280px}\n.cw-preview-card{background:#fff;border-radius:12px;border:1px solid #ddd;padding:16px}.cw-preview-img{height:150px;border-radius:9px;background:linear-gradient(135deg,#ececec,#fafafa);display:grid;place-items:center;color:#8a8a8a}.cw-heart-demo{margin-top:12px;width:100%;padding:11px;border:1px solid #333;border-radius:8px;background:#fff;font-weight:650}\n.cw-bar{display:flex;align-items:center;gap:10px}.cw-bar-track{height:9px;border-radius:10px;background:#eee;flex:1;overflow:hidden}.cw-bar-track i{display:block;height:100%;background:#303030}.cw-note{padding:12px 14px;border-radius:10px;background:#f1f8ff;border:1px solid #c9e3ff;font-size:13px}\n@media(max-width:900px){.cw-grid{grid-template-columns:repeat(2,1fr)}.cw-two{grid-template-columns:1fr}.cw-form-grid{grid-template-columns:1fr}}@media(max-width:560px){.cw-grid{grid-template-columns:1fr}.cw-card{padding:16px}}\n";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const items = await prisma.wishlistItem.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const productMap = new Map<
    string,
    { productId: string; title: string; image: string | null; count: number }
  >();

  for (const item of items) {
    const row = productMap.get(item.productId);
    if (row) row.count += 1;
    else productMap.set(item.productId, {
      productId: item.productId,
      title: item.title,
      image: item.image,
      count: 1,
    });
  }

  const topProducts = [...productMap.values()].sort((a, b) => b.count - a.count).slice(0, 15);
  const byDay = new Map<string, number>();
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  for (const item of items) {
    const key = new Date(item.createdAt).toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + 1);
  }

  return {
    topProducts,
    days: [...byDay.entries()].map(([date, count]) => ({ date, count })),
  };
}

export default function Analytics() {
  const data = useLoaderData<typeof loader>();
  const maxProduct = Math.max(1, ...data.topProducts.map((x) => x.count));
  const maxDay = Math.max(1, ...data.days.map((x) => x.count));

  return (
    <s-page heading="Wishlist analytics">
      <style>{styles}</style>
      <div className="cw-wrap cw-two">
        <div className="cw-card cw-gap">
          <div>
            <div className="cw-title">Top wishlisted products</div>
            <div className="cw-muted">Products with the highest number of saved customer items.</div>
          </div>

          {data.topProducts.length ? data.topProducts.map((product) => (
            <div className="cw-row" key={product.productId}>
              <div className="cw-product" style={{ minWidth: 220 }}>
                {product.image ? <img src={product.image} alt="" /> : null}
                <span>{product.title}</span>
              </div>
              <div className="cw-bar" style={{ flex: 1 }}>
                <div className="cw-bar-track">
                  <i style={{ width: `${(product.count / maxProduct) * 100}%` }} />
                </div>
                <b>{product.count}</b>
              </div>
            </div>
          )) : <div className="cw-note">No wishlist data yet.</div>}
        </div>

        <div className="cw-card cw-gap">
          <div><div className="cw-title">Wishlist saves</div><div className="cw-muted">Last 14 days</div></div>

          {data.days.map((day) => (
            <div key={day.date}>
              <div className="cw-row" style={{ marginBottom: 5 }}>
                <span className="cw-muted">{day.date.slice(5)}</span><b>{day.count}</b>
              </div>
              <div className="cw-bar-track">
                <i style={{ width: `${(day.count / maxDay) * 100}%` }} />
              </div>
            </div>
          ))}
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
