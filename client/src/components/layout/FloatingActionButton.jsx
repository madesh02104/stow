import React from "react";
import { ArrowUp } from "lucide-react";

export default function FloatingActionButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all active:scale-95"
      aria-label="Book Now - scroll to top"
    >
      <ArrowUp size={22} />
    </button>
  );
}
