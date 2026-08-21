import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings, updateSettings } from "../services/wishlist.server";

const styles = "\n:root{--cw-border:#e3e3e3;--cw-muted:#616161;--cw-card:#fff}\n.cw-wrap{max-width:1180px;margin:0 auto;padding:8px 0 28px}.cw-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}\n.cw-two{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.75fr);gap:18px}.cw-card{background:var(--cw-card);border:1px solid var(--cw-border);border-radius:14px;padding:20px;box-shadow:0 1px 0 rgba(0,0,0,.03)}\n.cw-stat strong{display:block;font-size:28px;line-height:1.15;margin-top:10px}.cw-stat span{font-size:13px;color:var(--cw-muted)}.cw-title{font-size:20px;font-weight:650;margin:0 0 5px}.cw-muted{color:var(--cw-muted)}\n.cw-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.cw-gap{display:grid;gap:14px}.cw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:8px;border:1px solid #8a8a8a;background:#fff;color:#202223;text-decoration:none;font-weight:600;cursor:pointer}\n.cw-btn-primary{background:#303030;color:#fff;border-color:#303030}.cw-pill{display:inline-flex;border-radius:999px;padding:4px 9px;background:#eaf7ef;color:#087a3f;font-size:12px;font-weight:650}.cw-progress{height:8px;background:#eee;border-radius:10px;overflow:hidden}.cw-progress>i{display:block;height:100%;background:#303030;border-radius:10px}\n.cw-table{width:100%;border-collapse:collapse}.cw-table th,.cw-table td{padding:12px 10px;border-bottom:1px solid #eee;text-align:left;font-size:14px}.cw-table th{color:#616161;font-weight:600}.cw-product{display:flex;align-items:center;gap:10px}.cw-product img{width:42px;height:42px;border-radius:8px;object-fit:cover;background:#f1f1f1}\n.cw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.cw-field{display:grid;gap:6px}.cw-field label{font-size:13px;font-weight:650}.cw-input,.cw-select{width:100%;box-sizing:border-box;border:1px solid #8a8a8a;border-radius:8px;padding:10px 11px;background:#fff;font:inherit}\n.cw-check{display:flex;align-items:flex-start;gap:10px}.cw-check input{margin-top:3px}.cw-check b{display:block;font-size:14px}.cw-check small{display:block;color:#616161;margin-top:2px}.cw-section-title{font-size:17px;font-weight:700;margin:0}.cw-preview{background:#f4f4f4;border-radius:14px;padding:18px;min-height:280px}\n.cw-preview-card{background:#fff;border-radius:12px;border:1px solid #ddd;padding:16px}.cw-preview-img{height:150px;border-radius:9px;background:linear-gradient(135deg,#ececec,#fafafa);display:grid;place-items:center;color:#8a8a8a}.cw-heart-demo{margin-top:12px;width:100%;padding:11px;border:1px solid #333;border-radius:8px;background:#fff;font-weight:650}\n.cw-bar{display:flex;align-items:center;gap:10px}.cw-bar-track{height:9px;border-radius:10px;background:#eee;flex:1;overflow:hidden}.cw-bar-track i{display:block;height:100%;background:#303030}.cw-note{padding:12px 14px;border-radius:10px;background:#f1f8ff;border:1px solid #c9e3ff;font-size:13px}\n@media(max-width:900px){.cw-grid{grid-template-columns:repeat(2,1fr)}.cw-two{grid-template-columns:1fr}.cw-form-grid{grid-template-columns:1fr}}@media(max-width:560px){.cw-grid{grid-template-columns:1fr}.cw-card{padding:16px}}\n";

function bool(form: FormData, name: string) {
  return form.get(name) === "on";
}

function int(form: FormData, name: string, fallback: number, min: number, max: number) {
  const value = Number(form.get(name));
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  const apiKey = process.env.SHOPIFY_API_KEY || "";

  return {
    shop: session.shop,
    settings,
    embedLink:
      `https://${session.shop}/admin/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/wishlist-embed`,
    wishlistUrl: `https://${session.shop}/pages/${settings.pageHandle}`,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "save");

  if (intent === "create-page") {
    const current = await getSettings(session.shop);
    const handle = String(form.get("pageHandle") || current.pageHandle || "wishlist")
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "wishlist";

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
            title: current.pageTitle || "My Wishlist",
            handle,
            body: "<div data-iwc-page></div>",
            isPublished: true,
          },
        },
      },
    );

    const result = await response.json();
    const page = result?.data?.pageCreate?.page;
    const errors = result?.data?.pageCreate?.userErrors || [];

    if (page) {
      await updateSettings(session.shop, { pageHandle: page.handle });
      return { ok: true, message: `Wishlist page created: /pages/${page.handle}` };
    }

    const duplicate = errors.some((error: any) =>
      String(error.message || "").toLowerCase().includes("handle"),
    );

    if (duplicate) {
      await updateSettings(session.shop, { pageHandle: handle });
      return {
        ok: true,
        message: `A page using "${handle}" already exists. The app will use /pages/${handle}.`,
      };
    }

    return {
      ok: false,
      message: errors.map((error: any) => error.message).join(", ") || "Page could not be created.",
    };
  }

  const pageHandle =
    String(form.get("pageHandle") || "wishlist")
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "wishlist";

  await updateSettings(session.shop, {
    enabled: bool(form, "enabled"),
    guestWishlist: bool(form, "guestWishlist"),
    loginRequired: bool(form, "loginRequired"),
    mergeGuestOnLogin: bool(form, "mergeGuestOnLogin"),

    productButtonEnabled: bool(form, "productButtonEnabled"),
    collectionButtonEnabled: bool(form, "collectionButtonEnabled"),
    buttonText: String(form.get("buttonText") || "Add to wishlist"),
    buttonAddedText: String(form.get("buttonAddedText") || "Wishlisted"),
    primaryColor: String(form.get("primaryColor") || "#17130F"),
    activeColor: String(form.get("activeColor") || "#D92D20"),
    iconSize: int(form, "iconSize", 22, 14, 42),
    buttonRadius: int(form, "buttonRadius", 8, 0, 30),

    floatingLauncherEnabled: bool(form, "floatingLauncherEnabled"),
    headerCounterEnabled: bool(form, "headerCounterEnabled"),
    launcherPosition: String(form.get("launcherPosition") || "bottom-right"),

    pageTitle: String(form.get("pageTitle") || "My Wishlist"),
    emptyText: String(form.get("emptyText") || "Your wishlist is empty."),
    pageHandle,
    columnsDesktop: int(form, "columnsDesktop", 4, 2, 6),
    columnsMobile: int(form, "columnsMobile", 2, 1, 2),
    showPrices: bool(form, "showPrices"),
    showVariant: bool(form, "showVariant"),
    showAddToCart: bool(form, "showAddToCart"),
    showRemove: bool(form, "showRemove"),

    toastEnabled: bool(form, "toastEnabled"),

    customProductSelector: String(form.get("customProductSelector") || "").trim(),
    customCardSelector: String(form.get("customCardSelector") || "").trim(),
    customHeaderSelector: String(form.get("customHeaderSelector") || "").trim(),
  });

  return { ok: true, message: "Wishlist settings saved." };
}

function Check({
  name,
  title,
  note,
  checked,
}: {
  name: string;
  title: string;
  note: string;
  checked: boolean;
}) {
  return (
    <label className="cw-check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>
        <b>{title}</b>
        <small>{note}</small>
      </span>
    </label>
  );
}

export default function Settings() {
  const data = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const s = data.settings;

  return (
    <s-page heading="Wishlist settings">
      <style>{styles}</style>

      <div className="cw-wrap cw-gap">
        {result?.message ? (
          <div
            className="cw-note"
            style={{
              background: result.ok ? "#f0fff4" : "#fff1f0",
              borderColor: result.ok ? "#b7ebc6" : "#ffc9c5",
            }}
          >
            {result.message}
          </div>
        ) : null}

        <div className="cw-row">
          <div>
            <div className="cw-title">Storefront customization</div>
            <div className="cw-muted">
              Everything below is controlled from the app. No product/page blocks.
            </div>
          </div>
          <a className="cw-btn cw-btn-primary" href={data.embedLink} target="_top">
            Enable App Embed
          </a>
        </div>

        <Form method="post" className="cw-gap">
          <input type="hidden" name="intent" value="save" />

          <div className="cw-two">
            <div className="cw-gap">
              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">General</h2>

                <Check name="enabled" title="Enable wishlist" note="Master switch for storefront wishlist behavior." checked={s.enabled} />
                <Check name="guestWishlist" title="Allow guest wishlists" note="Guests are stored in their browser using localStorage." checked={s.guestWishlist} />
                <Check name="mergeGuestOnLogin" title="Merge guest items after login" note="Moves guest items into the logged-in customer's persistent wishlist." checked={s.mergeGuestOnLogin} />
                <Check name="loginRequired" title="Require customer login" note="When enabled, guest heart clicks redirect to customer login." checked={s.loginRequired} />
              </section>

              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">Product & collection buttons</h2>

                <div className="cw-form-grid">
                  <Check name="productButtonEnabled" title="Product page button" note="Automatically inject below the product form." checked={s.productButtonEnabled} />
                  <Check name="collectionButtonEnabled" title="Collection card hearts" note="Automatically inject on detected product cards." checked={s.collectionButtonEnabled} />
                </div>

                <div className="cw-form-grid">
                  <div className="cw-field">
                    <label>Add text</label>
                    <input className="cw-input" name="buttonText" defaultValue={s.buttonText} />
                  </div>
                  <div className="cw-field">
                    <label>Added text</label>
                    <input className="cw-input" name="buttonAddedText" defaultValue={s.buttonAddedText} />
                  </div>
                </div>

                <div className="cw-form-grid">
                  <div className="cw-field">
                    <label>Primary color</label>
                    <input className="cw-input" name="primaryColor" type="color" defaultValue={s.primaryColor} style={{ minHeight: 44 }} />
                  </div>
                  <div className="cw-field">
                    <label>Active heart color</label>
                    <input className="cw-input" name="activeColor" type="color" defaultValue={s.activeColor} style={{ minHeight: 44 }} />
                  </div>
                </div>

                <div className="cw-form-grid">
                  <div className="cw-field">
                    <label>Icon size (px)</label>
                    <input className="cw-input" name="iconSize" type="number" min="14" max="42" defaultValue={s.iconSize} />
                  </div>
                  <div className="cw-field">
                    <label>Button radius (px)</label>
                    <input className="cw-input" name="buttonRadius" type="number" min="0" max="30" defaultValue={s.buttonRadius} />
                  </div>
                </div>
              </section>

              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">Wishlist page</h2>

                <div className="cw-form-grid">
                  <div className="cw-field">
                    <label>Page title</label>
                    <input className="cw-input" name="pageTitle" defaultValue={s.pageTitle} />
                  </div>
                  <div className="cw-field">
                    <label>Page handle</label>
                    <input className="cw-input" name="pageHandle" defaultValue={s.pageHandle} />
                  </div>
                </div>

                <div className="cw-field">
                  <label>Empty state message</label>
                  <input className="cw-input" name="emptyText" defaultValue={s.emptyText} />
                </div>

                <div className="cw-form-grid">
                  <div className="cw-field">
                    <label>Desktop columns</label>
                    <select className="cw-select" name="columnsDesktop" defaultValue={String(s.columnsDesktop)}>
                      <option value="2">2 columns</option><option value="3">3 columns</option><option value="4">4 columns</option><option value="5">5 columns</option><option value="6">6 columns</option>
                    </select>
                  </div>
                  <div className="cw-field">
                    <label>Mobile columns</label>
                    <select className="cw-select" name="columnsMobile" defaultValue={String(s.columnsMobile)}>
                      <option value="1">1 column</option><option value="2">2 columns</option>
                    </select>
                  </div>
                </div>

                <div className="cw-form-grid">
                  <Check name="showPrices" title="Show price" note="Display product price in wishlist cards." checked={s.showPrices} />
                  <Check name="showVariant" title="Show variant" note="Display selected variant title." checked={s.showVariant} />
                  <Check name="showAddToCart" title="Add to cart" note="Allow adding a saved variant directly to cart." checked={s.showAddToCart} />
                  <Check name="showRemove" title="Remove control" note="Display remove button on wishlist cards." checked={s.showRemove} />
                </div>
              </section>

              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">Launcher & header</h2>
                <div className="cw-form-grid">
                  <Check name="floatingLauncherEnabled" title="Floating launcher" note="Show a floating heart with live wishlist count." checked={s.floatingLauncherEnabled} />
                  <Check name="headerCounterEnabled" title="Inject header counter" note="Inject a wishlist count link into a detected header area." checked={s.headerCounterEnabled} />
                </div>

                <div className="cw-field">
                  <label>Floating launcher position</label>
                  <select className="cw-select" name="launcherPosition" defaultValue={s.launcherPosition}>
                    <option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option>
                  </select>
                </div>
              </section>

              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">Behavior</h2>
                <Check name="toastEnabled" title="Toast notifications" note="Show a short Added / Removed confirmation." checked={s.toastEnabled} />
              </section>

              <section className="cw-card cw-gap">
                <h2 className="cw-section-title">Advanced theme selectors</h2>
                <div className="cw-note">
                  Leave these blank for automatic detection. Use custom selectors only if your theme markup is unusual.
                </div>

                <div className="cw-field">
                  <label>Product form selector</label>
                  <input className="cw-input" name="customProductSelector" placeholder="Example: product-form form" defaultValue={s.customProductSelector} />
                </div>

                <div className="cw-field">
                  <label>Product card selector</label>
                  <input className="cw-input" name="customCardSelector" placeholder="Example: .custom-product-card" defaultValue={s.customCardSelector} />
                </div>

                <div className="cw-field">
                  <label>Header injection selector</label>
                  <input className="cw-input" name="customHeaderSelector" placeholder="Example: .header__icons" defaultValue={s.customHeaderSelector} />
                </div>
              </section>

              <div className="cw-row">
                <button className="cw-btn cw-btn-primary" type="submit">Save all settings</button>
              </div>
            </div>

            <aside className="cw-gap">
              <div className="cw-card cw-gap">
                <h2 className="cw-section-title">Live-style preview</h2>
                <div className="cw-preview">
                  <div className="cw-preview-card">
                    <div className="cw-preview-img">Product image</div>
                    <div style={{ marginTop: 12, fontWeight: 650 }}>Example product</div>
                    <div className="cw-muted">$29.00</div>
                    <button type="button" className="cw-heart-demo" style={{ borderColor: s.primaryColor, color: s.primaryColor, borderRadius: s.buttonRadius }}>
                      ♡ {s.buttonText}
                    </button>
                  </div>
                </div>
              </div>

              <div className="cw-card cw-gap">
                <h2 className="cw-section-title">Wishlist page setup</h2>
                <div className="cw-muted">
                  Create a normal Shopify page containing the wishlist mount element. The global embed renders the complete page automatically.
                </div>

                <button
                  className="cw-btn cw-btn-primary"
                  type="submit"
                  name="intent"
                  value="create-page"
                  formAction="/app/settings"
                  formMethod="post"
                >
                  Create /pages/{s.pageHandle}
                </button>

                <a className="cw-btn" href={data.wishlistUrl} target="_blank" rel="noreferrer">Open wishlist page</a>
              </div>

              <div className="cw-card cw-gap">
                <h2 className="cw-section-title">Theme installation</h2>
                <div className="cw-muted">
                  Only one global App Embed is required. No product button blocks, wishlist page blocks or count blocks.
                </div>
                <a className="cw-btn cw-btn-primary" href={data.embedLink} target="_top">Open App Embed</a>
              </div>
            </aside>
          </div>
        </Form>
      </div>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
