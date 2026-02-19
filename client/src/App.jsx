import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateListingPage from "./pages/CreateListingPage";
import EditListingPage from "./pages/EditListingPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import MyListingsPage from "./pages/MyListingsPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AllListingsPage from "./pages/AllListingsPage";
import ProfilePage from "./pages/ProfilePage";
import ProviderBookingsPage from "./pages/ProviderBookingsPage";

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth page (no header/footer) */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Main pages with layout */}
          <Route
            path="/"
            element={
              <Layout>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SearchResultsPage />
              </Layout>
            }
          />
          <Route
            path="/listings"
            element={
              <Layout>
                <AllListingsPage />
              </Layout>
            }
          />
          <Route
            path="/create-listing"
            element={
              <Layout>
                <CreateListingPage />
              </Layout>
            }
          />
          <Route
            path="/edit-listing/:id"
            element={
              <Layout>
                <EditListingPage />
              </Layout>
            }
          />
          <Route
            path="/listing/:id"
            element={
              <Layout>
                <BookingDetailPage />
              </Layout>
            }
          />
          <Route
            path="/my-listings"
            element={
              <Layout>
                <MyListingsPage />
              </Layout>
            }
          />
          <Route
            path="/bookings"
            element={
              <Layout>
                <BookingHistoryPage />
              </Layout>
            }
          />
          <Route
            path="/provider-bookings"
            element={
              <Layout>
                <ProviderBookingsPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="text-center py-32 text-gray-500">
                  Page not found
                </div>
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
