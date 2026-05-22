// web/frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Page, Layout, Card, DataTable, Badge, Text,
  Banner, Spinner, EmptyState, Button, ButtonGroup
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [wishlists, setWishlists] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      const res = await fetch("/api/admin/wishlists");
      const data = await res.json();
      if (data.success) {
        setWishlists(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rows = Object.entries(wishlists).map(([customerId, items]) => [
    customerId,
    items[0]?.shop || "-",
    items.length,
    new Date(items[0]?.createdAt).toLocaleDateString(),
    <Button size="slim" onClick={() => navigate(`/wishlists/${customerId}`)}>
      View
    </Button>,
  ]);

  if (loading) {
    return (
      <Page title="Wishlist App">
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="💝 Wishlist Dashboard"
      subtitle="Manage your customers' wishlists"
      primaryAction={{ content: "Refresh", onAction: fetchWishlists }}
    >
      <Layout>
        <Layout.Section>
          <Banner title={`Total Wishlist Items: ${total}`} status="info">
            <p>Track what your customers love and never miss a sale!</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {rows.length === 0 ? (
              <EmptyState
                heading="No wishlists yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>When customers add products to their wishlists, they'll appear here.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text", "text"]}
                headings={["Customer ID", "Shop", "Items", "First Added", "Action"]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
