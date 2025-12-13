import React from "react";
import { Facebook, Instagram, Linkedin, Mail, ArrowUp } from "lucide-react";

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative bg-[#050505] text-white border-t border-white/10 overflow-hidden">

            {/* --- Embedded Styles --- */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85;
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-bronze { color: var(--accent-bronze); }
        .hover-text-bronze:hover { color: var(--accent-bronze); }
        .border-bronze { border-color: var(--accent-bronze); }
      `}</style>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12 md:py-16 lg:py-24 font-premium">

                {/* --- Top Section: Brand & Nav Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 mb-12 md:mb-16 lg:mb-20">

                    {/* Brand Column */}
                    <div className="md:col-span-5 space-y-4 md:space-y-6">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                            Ambassadeur Prestige
                        </h2>
                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm">
                            Redefining luxury living in Tunis. A master-planned community designed for those who seek exclusivity, privacy, and architectural excellence.
                        </p>

                        {/* Socials */}
                        <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                            {[
                                { icon: <Instagram className="w-5 h-5" />, href: "#" },
                                { icon: <Facebook className="w-5 h-5" />, href: "#" },
                                { icon: <Linkedin className="w-5 h-5" />, href: "#" },
                                { icon: <Mail className="w-5 h-5" />, href: "mailto:contact@ambassadeur.com" },
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-bronze hover:border-bronze transition-all duration-300"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden md:block md:col-span-1"></div>

                    {/* Links Column 1: Navigation */}
                    <div className="md:col-span-3 space-y-4 md:space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Explore
                        </h3>
                        <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-gray-300">
                            <li><a href="/" className="hover-text-bronze transition-colors">Master Plan</a></li>
                            <li><a href="/plan" className="hover-text-bronze transition-colors">Floor Plans</a></li>
                            <li><a href="#location" className="hover-text-bronze transition-colors">Location</a></li>
                            <li><a href="#technology" className="hover-text-bronze transition-colors">Smart Living</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2: Legal/Contact */}
                    <div className="md:col-span-3 space-y-4 md:space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Information
                        </h3>
                        <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-gray-300">
                            <li><a href="#contact" className="hover-text-bronze transition-colors">Book a Viewing</a></li>
                        </ul>
                    </div>

                </div>

                {/* --- Divider --- */}
                <div className="w-full h-px bg-white/10 mb-8"></div>

                {/* --- Bottom Section: Copyright & Back to Top --- */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    <div className="text-xs text-gray-500 font-medium tracking-wide">
                        &copy; {new Date().getFullYear()} Ambassadeur Prestige.
                        <span className="hidden sm:inline"> All rights reserved.</span>
                    </div>

                    {/* Back to Top Button */}
                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                    >
                        Back to Top
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-bronze group-hover:bg-bronze group-hover:text-black transition-all duration-300">
                            <ArrowUp className="w-4 h-4" />
                        </div>
                    </button>
                </div>

            </div>
        </footer>
    );
}