import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CreateListing from "../components/listing/CreateListing";

export default function CreateListingPage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Create a Listing
        </h1>
        <p className="text-sm text-slate-body mt-1">
          Share your unused space with the community.
        </p>
      </div>
      <CreateListing />
    </div>
  );
}
