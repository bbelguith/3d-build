import React, { useState, useEffect, useRef } from "react";
import { Phone, MapPin, ChevronDown, Check } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // 1. Added useNavigate
import InquireModal from "./InquireModal";

export default function Navbar({ playVideo }) {
  const location = useLocation();
  const navigate = useNavigate(); // 2. Initialize navigation
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { label: "MASTER PLAN", path: "/" },
    { label: "FLOOR PLANS", path: "/plan" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Smart Location Handler
  const handleLocationClick = () => {
    const targetId = "location";

    if (location.pathname === "/") {
      // SCENARIO A: Already on Home Page -> Just Scroll
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // SCENARIO B: On another page -> Navigate first, then Scroll
      navigate("/");

      // Wait for the PageTransition (approx 800ms) to finish before scrolling
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 1000); // 1 second delay ensures page is fully loaded
    }
  };

  const isItemActive = (item) => {
    if (item.path === "/") return location.pathname === "/";
    if (item.path === "/plan") return location.pathname.startsWith("/plan");
    return location.pathname === item.path;
  };

  const handleNavClick = (item, e) => {
    if (item.label === "FLOOR PLANS") {
      e.preventDefault();
      setShowDropdown((prev) => !prev);
    }
  };

  const thinStroke = 1.5;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85; 
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .crystal-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.04);
        }
        
        .crystal-panel:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(255, 255, 255, 0.7);
        }

        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .text-bronze { color: var(--accent-bronze); }
        .bg-bronze { background-color: var(--accent-bronze); }
        .hover-text-bronze:hover { color: var(--accent-bronze); }
        .border-bronze { border-color: var(--accent-bronze); }
        
        /* Hide navbar buttons when zone editor is active */
        body.zone-editor-active .zone-editor-hide {
          display: none !important;
        }
      `}</style>

      <div className="fixed top-2 md:top-5 left-0 right-0 z-50 px-3 md:px-5 flex justify-between items-start pointer-events-none select-none font-premium">

        {/* --- LEFT SECTION --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 md:gap-2 pointer-events-auto">

          {/* Brand Plaque */}
          <div className="crystal-panel rounded-[12px] md:rounded-[14px] px-3 md:px-4 py-2 md:py-2.5 smooth-transition hover:scale-[1.01]">
            <a
              href="/"
              className="font-bold text-xs md:text-[14px] text-gray-900 tracking-widest uppercase whitespace-nowrap block"
            >
              Ambassadeur Prestige
            </a>
          </div>

          {/* Navigation Controller */}
          <div className="crystal-panel flex items-center gap-0.5 md:gap-1 rounded-[12px] md:rounded-[14px] p-1 md:p-1.5 text-[10px] md:text-[12px] text-gray-500 smooth-transition">
            {navItems.map((item, index) => {
              const isActive = isItemActive(item);
              const isFloorPlan = item.label === "FLOOR PLANS";

              return (
                <React.Fragment key={item.label}>
                  <div className="relative" ref={isFloorPlan ? dropdownRef : null}>
                    <Link
                      to={item.path}
                      onClick={(e) => handleNavClick(item, e)}
                      className={`
                        group flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-[8px] md:rounded-[10px] text-[10px] md:text-[12px] font-semibold tracking-wider smooth-transition
                        ${isActive
                          ? "bg-white shadow-sm text-gray-900"
                          : "bg-transparent hover:bg-white/50 text-gray-500 hover:text-gray-900"
                        }
                      `}
                    >
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-bronze mr-0.5"></div>}

                      {item.label}

                      {isFloorPlan && (
                        <ChevronDown
                          strokeWidth={thinStroke}
                          className={`w-2.5 h-2.5 md:w-3 md:h-3 smooth-transition ${showDropdown ? "rotate-180 text-bronze" : "rotate-0"
                            } ${isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}
                        />
                      )}
                    </Link>

                    {/* Crystal Dropdown Menu */}
                    {isFloorPlan && (
                      <div
                        className={`
                          absolute top-full left-0 mt-2 w-48 md:w-52 crystal-panel !bg-white/90 rounded-[12px] md:rounded-[14px] overflow-hidden z-50 origin-top-left smooth-transition
                          ${showDropdown
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                          }
                        `}
                      >
                        <div className="p-1.5 space-y-0.5">
                          <DropdownItem
                            to="/plan"
                            label="Plan Type A"
                            subLabel="North View • 120m²"
                            currentPath={location.pathname}
                            close={() => setShowDropdown(false)}
                            thinStroke={thinStroke}
                          />
                          <DropdownItem
                            to="/planb"
                            label="Plan Type B"
                            subLabel="Panoramic View • 165m²"
                            currentPath={location.pathname}
                            close={() => setShowDropdown(false)}
                            thinStroke={thinStroke}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {index < navItems.length - 1 && (
                    <div className="w-px h-3 bg-gray-400/20 mx-1"></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* --- RIGHT SECTION: Utility Links --- */}
        <div className="hidden sm:flex items-center gap-0.5 md:gap-1 crystal-panel rounded-[12px] md:rounded-[14px] p-1 md:p-1.5 pointer-events-auto smooth-transition zone-editor-hide">

          {/* Inquire Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-1.5 md:gap-2 bg-transparent hover:bg-white text-gray-500 hover-text-bronze px-2 md:px-3 py-1 md:py-1.5 rounded-[8px] md:rounded-[10px] text-[10px] md:text-[12px] font-semibold tracking-wider smooth-transition"
          >
            <Phone strokeWidth={thinStroke} className="w-3 h-3 md:w-3.5 md:h-3.5 smooth-transition group-hover:text-bronze" />
            <span className="hidden md:inline">INQUIRE</span>
          </button>

          <div className="w-px h-2.5 md:h-3 bg-gray-400/20 mx-0.5 md:mx-1"></div>

          {/* 4. Location Button (Uses updated click handler) */}
          <button
            onClick={handleLocationClick}
            className="group flex items-center gap-1.5 md:gap-2 bg-transparent hover:bg-white text-gray-500 hover-text-bronze px-2 md:px-3 py-1 md:py-1.5 rounded-[8px] md:rounded-[10px] text-[10px] md:text-[12px] font-semibold tracking-wider smooth-transition"
          >
            <MapPin strokeWidth={thinStroke} className="w-3 h-3 md:w-3.5 md:h-3.5 smooth-transition group-hover:text-bronze" />
            <span className="hidden md:inline">LOCATION</span>
          </button>
        </div>
      </div>

      <InquireModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// Sub-component - Technical Detail View
function DropdownItem({ to, label, subLabel, currentPath, close, thinStroke }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      onClick={close}
      className={`
        relative flex items-start justify-between px-3 py-2.5 rounded-[10px] smooth-transition group border border-transparent
        ${isActive
          ? "bg-white text-gray-900 border-gray-100 shadow-sm"
          : "text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:border-white/50"
        }
      `}
    >
      <div className="flex flex-col">
        <span className={`text-xs md:text-[13px] font-bold tracking-wide ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
          {label}
        </span>
        {subLabel && (
          <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-medium mt-0.5 smooth-transition group-hover:text-bronze">
            {subLabel}
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-0.5">
          <Check className="w-3.5 h-3.5 text-bronze" strokeWidth={thinStroke + 0.5} />
        </div>
      )}
    </Link>
  );
}