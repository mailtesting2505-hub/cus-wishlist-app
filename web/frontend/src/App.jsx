// web/frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import Dashboard from "./pages/Dashboard.jsx";
import WishlistDetails from "./pages/WishlistDetails.jsx";

export default function App() {
  return (
    <AppProvider i18n={enTranslations}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wishlists" element={<Dashboard />} />
          <Route path="/wishlists/:customerId" element={<WishlistDetails />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
