import React from "react";
import { Package, Github, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-white">Stow</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              The peer-to-peer marketplace for hyper-local storage & parking.
              Flexible slot allocation, verified with our Chain of Custody
              system.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/create-listing"
                  className="hover:text-primary transition"
                >
                  List Your Space
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-primary transition">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-primary transition cursor-pointer">
                  About Us
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-primary transition cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Stow. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Github
              size={18}
              className="hover:text-primary cursor-pointer transition"
            />
            <Twitter
              size={18}
              className="hover:text-primary cursor-pointer transition"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
