// web/frontend/src/pages/WishlistDetails.jsx
import React, { useState, useEffect } from "react";
import {
  Page, Layout, Card, ResourceList, ResourceItem,
  Thumbnail, Text, Badge, Spinner, Button
} from "@shopify/polaris";
import { useParams, useNavigate } from "react-router-dom";

export default function WishlistDetails() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerWishlist();
  }, [customerId]);

  const fetchCustomerWishlist = async () => {
    try {
      const res = await fetch(`/api/admin/wishlists`);
      const data = await res.json();
      if (data.success && data.data[customerId]) {
        setItems(data.data[customerId]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Customer Wishlist">
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={`Customer Wishlist`}
      subtitle={`Customer ID: ${customerId}`}
      breadcrumbs={[{ content: "Dashboard", onAction: () => navigate("/") }]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              {items.length} item{items.length !== 1 ? "s" : ""} in wishlist
            </Text>
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={items}
              renderItem={(item) => (
                <ResourceItem
                  id={item.id}
                  media={
                    <Thumbnail
                      source={item.productImage || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-3_large.png"}
                      alt={item.productTitle}
                    />
                  }
                  name={item.productTitle}
                >
                  <Text variant="bodyMd" fontWeight="bold">{item.productTitle}</Text>
                  <Text variant="bodyMd" color="subdued">Price: {item.productPrice || "N/A"}</Text>
                  <Text variant="bodySm" color="subdued">
                    Added: {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <div style={{ marginTop: "8px" }}>
                    <Button
                      size="slim"
                      url={`https://${item.shop}/products/${item.productHandle}`}
                      external
                    >
                      View Product
                    </Button>
                  </div>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
