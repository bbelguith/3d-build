import React, { useRef, useState, useEffect } from "react";
import emailjs from "emailjs-com";
import { Mail, Phone, MapPin, ArrowRight, Copy, Check } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function Contact() {
    const formRef = useRef();
    const [isSending, setIsSending] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // --- Audio Logic (Preserved) ---
    const successAudio = useRef(new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_3d1f2e7d2f.mp3?filename=success-1-6297.mp3"));
    const errorAudio = useRef(new Audio("https://cdn.pixabay.com/download/audio/2022/03/10/audio_3b1b3f87c7.mp3?filename=error-126627.mp3"));
    const copyAudio = useRef(new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_4f7b1b32f7.mp3?filename=button-click-131479.mp3"));

    useEffect(() => {
        [successAudio, errorAudio, copyAudio].forEach((ref) => {
            ref.current.volume = 0.2; // Lowered slightly for subtle elegance
            ref.current.preload = "auto";
            ref.current.crossOrigin = "anonymous";
        });
    }, []);

    useEffect(() => {
        // Mark interaction on any user action
        const handleUserInteraction = () => {
            setHasUserInteracted(true);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('click', handleUserInteraction);
        };
        
        document.addEventListener('touchstart', handleUserInteraction, { once: true });
        document.addEventListener('click', handleUserInteraction, { once: true });
        
        return () => {
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('click', handleUserInteraction);
        };
    }, []);

    const playSound = (type) => {
        // Only play sound if user has interacted (iOS requirement)
        if (!hasUserInteracted) return;
        
        try {
            const map = { success: successAudio.current, error: errorAudio.current, copy: copyAudio.current };
            const snd = map[type];
            if (!snd) return;
            snd.currentTime = 0;
            setTimeout(() => snd.play().catch(() => { }), 50);
        } catch { }
    };

    // --- Form Logic ---
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email?.trim());

    const sendEmail = (e) => {
        e.preventDefault();
        const form = formRef.current;
        const { name, email, message } = form;

        if (!name.value.trim() || !message.value.trim()) {
            playSound("error");
            toast.error("Please complete all fields.");
            return;
        }

        if (!validateEmail(email.value)) {
            playSound("error");
            toast.error("Invalid email address.");
            return;
        }

        setIsSending(true);

        emailjs
            .send(
                "service_x4j2wo9",
                "template_12id7e9",
                {
                    name: name.value.trim(),
                    email: email.value.trim(),
                    message: message.value.trim(),
                },
                "zK1VYa0njiHvCc8MG"
            )
            .then(
                () => {
                    playSound("success");
                    toast.success("Inquiry received. We will be in touch shortly.");
                    setIsSending(false);
                    form.reset();
                },
                () => {
                    playSound("error");
                    toast.error("Transmission failed. Please try again.");
                    setIsSending(false);
                }
            );
    };

    const copyToClipboard = async (text, fieldId) => {
        playSound("copy");
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldId);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            playSound("error");
        }
    };

    return (
        <section id="contact" className="relative py-12 md:py-16 lg:py-24 bg-white overflow-hidden">

            {/* --- Embedded Styles --- */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        :root {
          --accent-bronze: #b49b85;
        }

        .font-premium { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-bronze { color: var(--accent-bronze); }
        .bg-bronze { background-color: var(--accent-bronze); }
        .border-bronze { border-color: var(--accent-bronze); }
        
        /* Custom Input Underline Animation */
        .input-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 1px;
          width: 0;
          background-color: var(--accent-bronze);
          transition: width 0.4s ease;
        }
        .group:focus-within .input-underline {
          width: 100%;
        }
      `}</style>

            {/* Modern Toaster */}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #333',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '13px'
                    }
                }}
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 font-premium">

                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 lg:mb-20 gap-6 md:gap-8">
                    <div className="space-y-3 md:space-y-4">
                        <span className="text-bronze text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                            04 — Inquiries
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 tracking-tight leading-tight">
                            Get in <span className="font-bold">Touch</span>
                        </h2>
                    </div>
                    <div className="hidden md:block h-px w-full max-w-xs bg-gray-200 mb-2"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 xl:gap-24">

                    {/* --- Left: Architectural Form --- */}
                    <div className="lg:col-span-7">
                        <form ref={formRef} onSubmit={sendEmail} className="space-y-8 md:space-y-10 lg:space-y-12" noValidate>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
                                {/* Name Input */}
                                <div className="group relative">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-bronze transition-colors">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-transparent border-b border-gray-200 py-3 text-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-transparent transition-all"
                                    />
                                    <div className="input-underline"></div>
                                </div>

                                {/* Email Input */}
                                <div className="group relative">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-bronze transition-colors">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="e.g. john@example.com"
                                        className="w-full bg-transparent border-b border-gray-200 py-3 text-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-transparent transition-all"
                                    />
                                    <div className="input-underline"></div>
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="group relative">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-bronze transition-colors">
                                    Your Message
                                </label>
                                <textarea
                                    name="message"
                                    rows="3"
                                    required
                                    placeholder="Tell us about your requirements..."
                                    className="w-full bg-transparent border-b border-gray-200 py-3 text-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:border-transparent transition-all resize-none"
                                />
                                <div className="input-underline"></div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="group relative inline-flex items-center gap-4 bg-black text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-bronze transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? "Processing..." : "Send Message"}
                                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* --- Right: Contact Info (Spec Sheet Style) --- */}
                    <div className="lg:col-span-5 space-y-8 md:space-y-10 lg:space-y-12">

                        <div className="bg-gray-50 p-6 md:p-8 lg:p-10 border border-gray-100">
                            <h3 className="text-xl font-light text-gray-900 mb-8">
                                Direct <span className="font-bold">Contact</span>
                            </h3>

                            <div className="space-y-8">
                                {/* Email Item */}
                                <ContactItem
                                    icon={<Mail className="w-5 h-5" />}
                                    label="General Inquiries"
                                    value="ambassadeur-prestige@gmail.com"
                                    copyValue="ambassadeur-prestige@gmail.com"
                                    onCopy={copyToClipboard}
                                    isCopied={copiedField === 'email'}
                                    fieldId="email"
                                />

                                <div className="w-full h-px bg-gray-200"></div>

                                {/* Phone Item */}
                                <ContactItem
                                    icon={<Phone className="w-5 h-5" />}
                                    label="Sales Office"
                                    value="+216 12 345 678"
                                    copyValue="+21612345678"
                                    onCopy={copyToClipboard}
                                    isCopied={copiedField === 'phone'}
                                    fieldId="phone"
                                />

                                <div className="w-full h-px bg-gray-200"></div>

                                {/* Address Item (No Copy) */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                        <MapPin className="w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                            Showroom
                                        </span>
                                        <span className="block text-lg text-gray-900 leading-tight">
                                            Les Berges du Lac II,<br />Tunis, Tunisia
                                        </span>
                                        <a
                                            href="https://goo.gl/maps/placeholder"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block mt-3 text-xs font-bold text-bronze uppercase tracking-wider border-b border-bronze pb-0.5 hover:text-black hover:border-black transition-colors"
                                        >
                                            Get Directions
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}

// Sub-component for individual contact rows
function ContactItem({ icon, label, value, copyValue, onCopy, isCopied, fieldId }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-bronze group-hover:border-bronze/30 transition-colors shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {label}
                </span>
                <div className="flex items-center gap-3">
                    <span className="block text-lg text-gray-900 break-all sm:break-normal">
                        {value}
                    </span>
                    <button
                        onClick={() => onCopy(copyValue, fieldId)}
                        className="text-gray-300 hover:text-bronze transition-colors p-1"
                        title="Copy to clipboard"
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}