"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-40 w-10 h-10 flex items-center justify-center bg-transparent border text-white transition-opacity ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      } hover:opacity-50`}
      style={{ borderColor: "rgba(255,255,255,0.2)" }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M7 12V2M7 2L2 7M7 2L12 7"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
    </button>
  );
}
