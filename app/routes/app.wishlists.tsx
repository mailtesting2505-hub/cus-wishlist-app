import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const styles = ":root{--cw-ink:#171717;--cw-ink-soft:#2b2926;--cw-muted:#77716a;--cw-line:#e7e1d8;--cw-line-strong:#d7cec2;--cw-bg:#f6f3ee;--cw-surface:#fff;--cw-surface-2:#fbfaf7;--cw-accent:#a77b4d;--cw-accent-soft:#efe5d8;--cw-success:#24704a;--cw-danger:#b13b31;--cw-shadow:0 18px 50px rgba(34,28,20,.07);--cw-shadow-soft:0 8px 24px rgba(34,28,20,.055)}\nhtml,body{background:var(--cw-bg)!important}body{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Inter,Roboto,Helvetica,Arial,sans-serif!important;color:var(--cw-ink)}\n.cw-wrap{max-width:1240px;margin:0 auto;padding:18px 4px 42px}.cw-gap{display:grid;gap:18px}.cw-row{display:flex;align-items:center;justify-content:space-between;gap:18px}\n.cw-title{font-size:22px;line-height:1.18;letter-spacing:-.025em;font-weight:720;color:var(--cw-ink);margin:0 0 5px}.cw-muted{color:var(--cw-muted);line-height:1.55}.cw-section-title{margin:0;font-size:17px;line-height:1.25;font-weight:720;letter-spacing:-.015em;color:var(--cw-ink)}\n.cw-card{position:relative;background:linear-gradient(180deg,#fff 0%,#fefdfb 100%);border:1px solid var(--cw-line);border-radius:20px;padding:22px;box-shadow:var(--cw-shadow-soft);overflow:hidden}.cw-card::before{content:\"\";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(167,123,77,.42),transparent);opacity:.55}\n.cw-two{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(310px,.72fr);gap:20px}.cw-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.cw-grid .cw-card{min-height:118px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:none;background:var(--cw-surface)}.cw-grid .cw-card:nth-child(1){background:linear-gradient(145deg,#171717,#2d2b28);border-color:#2e2b28;color:#fff}.cw-grid .cw-card:nth-child(1) span{color:rgba(255,255,255,.66)}.cw-grid .cw-card:nth-child(1) strong{color:#fff}\n.cw-stat span{font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.085em;color:var(--cw-muted)}.cw-stat strong{display:block;margin-top:18px;font-size:31px;line-height:1;font-weight:760;letter-spacing:-.04em;color:var(--cw-ink)}\n.cw-btn{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 15px;border:1px solid var(--cw-line-strong);border-radius:10px;background:#fff;color:var(--cw-ink);text-decoration:none;font-weight:680;font-size:13px;cursor:pointer;box-shadow:0 1px 0 rgba(255,255,255,.75) inset;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease}.cw-btn:hover{transform:translateY(-1px);border-color:#bdb3a7;box-shadow:0 7px 18px rgba(35,29,22,.08)}.cw-btn-primary{border-color:#171717;color:#fff;background:linear-gradient(180deg,#2a2927 0%,#171717 100%);box-shadow:0 8px 20px rgba(23,23,23,.15)}.cw-btn-primary:hover{background:#0f0f0f;border-color:#0f0f0f}\n.cw-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid #dce8df;background:#f2f8f4;color:var(--cw-success);font-size:11px;line-height:1;font-weight:750;letter-spacing:.03em}.cw-progress{height:7px;overflow:hidden;border-radius:999px;background:#eee9e2}.cw-progress>i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#171717 0%,#a77b4d 100%)}\n.cw-table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden}.cw-table thead th{padding:11px 12px;border-bottom:1px solid var(--cw-line);background:var(--cw-surface-2);color:#817970;font-size:11px;line-height:1.2;font-weight:750;text-transform:uppercase;letter-spacing:.07em;text-align:left}.cw-table td{padding:14px 12px;border-bottom:1px solid #eee9e3;font-size:13px;color:#34312e;vertical-align:middle}.cw-table tbody tr{transition:background .15s ease}.cw-table tbody tr:hover{background:#fcfaf6}.cw-table tbody tr:last-child td{border-bottom:0}\n.cw-product{display:flex;align-items:center;gap:11px;min-width:0}.cw-product img{width:46px;height:46px;object-fit:cover;flex:0 0 46px;border-radius:11px;border:1px solid #eee7de;background:#f5f2ed}\n.cw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.cw-field{display:grid;gap:7px}.cw-field label{color:#4d4944;font-size:12px;font-weight:700;letter-spacing:.01em}.cw-input,.cw-select{width:100%;min-height:43px;box-sizing:border-box;padding:10px 12px;border:1px solid #d7d0c7;border-radius:11px;outline:none;background:#fff;color:#242220;font:inherit;font-size:13px;box-shadow:0 1px 0 rgba(0,0,0,.02);transition:border-color .15s ease,box-shadow .15s ease}.cw-input:focus,.cw-select:focus{border-color:#9c7c59;box-shadow:0 0 0 3px rgba(167,123,77,.12)}\n.cw-check{display:flex;align-items:flex-start;gap:11px;padding:12px 13px;border:1px solid #ece6de;border-radius:12px;background:#fdfcf9}.cw-check input{width:16px;height:16px;margin-top:2px;accent-color:#171717}.cw-check b{display:block;color:#282522;font-size:13px;font-weight:700}.cw-check small{display:block;margin-top:3px;color:#7b746d;font-size:12px;line-height:1.45}.cw-note{padding:13px 14px;border:1px solid #eadfce;border-radius:12px;background:#faf6ef;color:#665a4b;font-size:12px;line-height:1.55}\n.cw-preview{min-height:300px;display:grid;place-items:center;padding:22px;border:1px solid #e8e0d5;border-radius:16px;background:radial-gradient(circle at 15% 12%,rgba(167,123,77,.12),transparent 32%),linear-gradient(145deg,#f5f1ea,#fbfaf7)}.cw-preview-card{width:min(100%,260px);padding:14px;border:1px solid #e4ddd4;border-radius:16px;background:#fff;box-shadow:0 18px 40px rgba(34,28,20,.10)}.cw-preview-img{height:165px;display:grid;place-items:center;overflow:hidden;border-radius:12px;background:linear-gradient(135deg,#eee9e2,#faf8f4);color:#9a9289;font-size:12px}.cw-heart-demo{width:100%;margin-top:12px;padding:11px 13px;border:1px solid #2b2926;border-radius:10px;background:#fff;color:#242220;font-weight:720}\n.cw-bar{display:flex;align-items:center;gap:10px}.cw-bar-track{flex:1;height:8px;overflow:hidden;border-radius:999px;background:#eee9e2}.cw-bar-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#262421,#b18a60)}\n.cw-customer{display:grid;gap:3px}.cw-customer b{font-weight:720;color:#242220}.cw-email{color:#5a554f;font-size:12px}.cw-id{color:#9a9188;font-size:11px}.cw-avatar{width:38px;height:38px;display:grid;place-items:center;flex:0 0 38px;border-radius:50%;background:linear-gradient(145deg,#252321,#4a443e);color:#fff;font-weight:760;font-size:12px;box-shadow:0 6px 16px rgba(25,22,19,.14)}.cw-customer-cell{display:flex;align-items:center;gap:11px}.cw-count{display:inline-flex;min-width:30px;height:28px;align-items:center;justify-content:center;padding:0 8px;border-radius:999px;background:#f1ece5;color:#4a4036;font-weight:750}.cw-tags{display:flex;flex-wrap:wrap;gap:5px}.cw-tag{display:inline-flex;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 8px;border:1px solid #e8e0d7;border-radius:999px;background:#faf8f4;color:#655d55;font-size:11px}\n@media(max-width:980px){.cw-grid{grid-template-columns:repeat(2,1fr)}.cw-two{grid-template-columns:1fr}}@media(max-width:680px){.cw-wrap{padding:10px 0 28px}.cw-grid{grid-template-columns:1fr}.cw-form-grid{grid-template-columns:1fr}.cw-row{align-items:flex-start;flex-direction:column}.cw-card{padding:17px;border-radius:16px}.cw-table{display:block;overflow-x:auto}}";

type CustomerInfo = { legacyResourceId: string; displayName: string; email: string; };

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const items = await prisma.wishlistItem.findMany({ where: { shop: session.shop }, orderBy: { createdAt: "desc" }, take: 2000 });
  const grouped = new Map<string, { customerId: string; count: number; latest: string; products: string[] }>();
  for (const item of items) {
    const row = grouped.get(item.customerId);
    if (row) { row.count += 1; if (row.products.length < 4 && !row.products.includes(item.title)) row.products.push(item.title); }
    else grouped.set(item.customerId, { customerId: item.customerId, count: 1, latest: new Date(item.createdAt).toISOString(), products: [item.title] });
  }
  const customerIds = [...grouped.keys()].filter((id) => /^\d+$/.test(id)).slice(0, 250);
  const customerMap = new Map<string, CustomerInfo>();
  if (customerIds.length) {
    try {
      const response = await admin.graphql(`#graphql
        query WishlistCustomers($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Customer { legacyResourceId displayName defaultEmailAddress { emailAddress } }
          }
        }`, { variables: { ids: customerIds.map((id) => `gid://shopify/Customer/${id}`) } });
      const payload = await response.json();
      const nodes = payload?.data?.nodes || [];
      for (const node of nodes) if (node?.legacyResourceId) customerMap.set(String(node.legacyResourceId), { legacyResourceId: String(node.legacyResourceId), displayName: node.displayName || "", email: node.defaultEmailAddress?.emailAddress || "" });
    } catch (error) { console.error("Unable to load Shopify customer details:", error); }
  }
  const customers = [...grouped.values()].map((row) => ({ ...row, customer: customerMap.get(row.customerId) || null })).sort((a,b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
  return { customers };
}

function initials(name: string, email: string, id: string) {
  const base = (name || email || id).trim(); const parts = base.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : base.slice(0,2).toUpperCase();
}

export default function Wishlists() {
  const data = useLoaderData<typeof loader>();
  return (
    <s-page heading="Customer wishlists">
      <style>{styles}</style>
      <div className="cw-wrap cw-gap">
        <div className="cw-row">
          <div><div className="cw-title">Customer wishlists</div><div className="cw-muted">A refined view of logged-in shoppers and their saved products.</div></div>
          <span className="cw-pill">{data.customers.length} active customer{data.customers.length === 1 ? "" : "s"}</span>
        </div>
        <div className="cw-card cw-gap">
          {data.customers.length ? (
            <table className="cw-table">
              <thead><tr><th>Customer</th><th>Items</th><th>Recent products</th><th>Last activity</th></tr></thead>
              <tbody>{data.customers.map((row) => { const name=row.customer?.displayName || `Customer ${row.customerId}`; const email=row.customer?.email || ""; return (
                <tr key={row.customerId}>
                  <td><div className="cw-customer-cell"><div className="cw-avatar">{initials(name,email,row.customerId)}</div><div className="cw-customer"><b>{name}</b>{email ? <span className="cw-email">{email}</span> : <span className="cw-muted">Email unavailable</span>}<span className="cw-id">ID: {row.customerId}</span></div></div></td>
                  <td><span className="cw-count">{row.count}</span></td>
                  <td><div className="cw-tags">{row.products.map((product) => <span className="cw-tag" key={product}>{product}</span>)}</div></td>
                  <td>{new Date(row.latest).toLocaleString()}</td>
                </tr>); })}</tbody>
            </table>
          ) : <div className="cw-note">No logged-in customer wishlists yet. Customer activity will appear here automatically.</div>}
        </div>
      </div>
    </s-page>
  );
}
export function ErrorBoundary(){return boundary.error(useRouteError());}
export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
