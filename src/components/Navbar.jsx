import React, { useState } from "react";
import { Phone, MapPin, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar({ playVideo }) {
  const location = useLocation(); // Get the current route path
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { label: "Master Plan", path: "/" },
    { label: "Floor plan", path: "/plan" },
  ];

  // Logic to check if a nav item is active based on the current URL
  const isItemActive = (item) => {
    if (item.path === "/") {
      return location.pathname === "/";
    }
    // If the path is /plan, we want it active for both /plan and /planb
    if (item.path === "/plan") {
      return location.pathname.startsWith("/plan");
    }
    return location.pathname === item.path;
  };

  const handleClick = (item, e) => {
    if (item.label === "Apartment") {
      e.preventDefault();
      playVideo(
        "https://res.cloudinary.com/dzbmwlwra/video/upload/v1754833809/LateTransition_qmwchy.mp4",
        4,
        false
      );
    } else if (item.label === "Floor plan") {
      e.preventDefault();
      setShowDropdown((prev) => !prev);
    }
    // We don't need setActive anymore, URL handles it
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur-lg shadow-md border border-gray-200 rounded-lg px-3 py-2 pointer-events-auto relative">
        <a
          href="/"
          className="font-bold text-lg text-black tracking-tight whitespace-nowrap"
        >
          BNGIMMO
        </a>

        <div className="flex items-center gap-2 text-sm text-gray-700 relative">
          {navItems.map((item, index) => {
            const isActive = isItemActive(item);

            return (
              <React.Fragment key={item.label}>
                <div className="relative">
                  <Link
                    to={item.path}
                    onClick={(e) => handleClick(item, e)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${isActive
                        ? "bg-black text-white shadow"
                        : "bg-gray-100 hover:bg-gray-200"
                      }`}
                  >
                    {item.label}
                    {item.label === "Floor plan" && (
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    )}
                  </Link>

                  {/* Dropdown menu for Floor plan */}
                  {item.label === "Floor plan" && showDropdown && (
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-50">
                      <Link
                        to="/plan"
                        onClick={() => setShowDropdown(false)}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${location.pathname === "/plan" ? "bg-gray-100 font-bold" : ""
                          }`}
                      >
                        Plan Type A
                      </Link>
                      <Link
                        to="/planb"
                        onClick={() => setShowDropdown(false)}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${location.pathname === "/planb" ? "bg-gray-100 font-bold" : ""
                          }`}
                      >
                        Plan Type B
                      </Link>
                    </div>
                  )}
                </div>

                {index < navItems.length - 1 && (
                  <span className="text-gray-400">›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg shadow-md border border-gray-200 rounded-lg px-3 py-2 pointer-events-auto">
        {/* WhatsApp Call Me */}
        <a
          href="https://wa.me/21612345678"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-700 font-medium transition"
        >
          <Phone className="w-4 h-4" /> Call me
        </a>

        {/* Location Scroll */}
        <a
          href="#location"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-700 font-medium transition"
        >
          <MapPin className="w-4 h-4" /> Location
        </a>
      </div>
    </div>
  );
}