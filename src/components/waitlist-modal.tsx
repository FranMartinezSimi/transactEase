"use client"

import React, { useState, useEffect, useRef } from "react";
import { X, Mail, User, Rocket } from "lucide-react";

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
    const [user, setUser] = useState({
        email: "",
        name: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            setSubmitted(false); // Reset submitted state when opening
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    name: user.name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to join waitlist:', data.error);
                alert('Failed to join waitlist. Please try again.');
                setIsSubmitting(false);
                return;
            }

            setSubmitted(true);
            setIsSubmitting(false);

            // Limpiar y cerrar después de 2 segundos
            setTimeout(() => {
                setUser({ email: "", name: "" });
                setSubmitted(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error submitting waitlist:', error);
            alert('An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="backdrop:bg-black/80 backdrop:backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-0 border-2 border-primary/20 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
            onClose={onClose}
            onClick={e => {
                // Cierra si se hace click en el backdrop
                if (e.target === dialogRef.current) onClose();
            }}
        >
            <div className="glass p-8 relative rounded-xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {!submitted ? (
                    <>
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center">
                            <Rocket className="h-8 w-8 text-white" />
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold mb-3 text-foreground text-center">
                            Join the Waitlist
                        </h2>

                        {/* Description */}
                        <p className="mb-8 text-muted-foreground text-center">
                            Be among the first to access <span className="text-primary font-semibold">Sealdrop</span>.
                            We'll notify you when we're ready to launch.
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Input */}
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder="you@email.com"
                                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                                    value={user.email}
                                    onChange={e => setUser({ ...user, email: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Name Input */}
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                                    value={user.name}
                                    onChange={e => setUser({ ...user, name: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full gradient-primary text-white py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "I want to join!"}
                            </button>
                        </form>

                        {/* Footer Note */}
                        <p className="text-xs text-muted-foreground text-center mt-6">
                            No spam. We'll only contact you when we launch. You can unsubscribe at any time.
                        </p>
                    </>
                ) : (
                    // Success State
                    <div className="text-center py-8">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
                            <svg className="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            Welcome aboard!
                        </h3>
                        <p className="text-muted-foreground">
                            We've added you to the list. We'll notify you soon.
                        </p>
                    </div>
                )}
            </div>
        </dialog>
    );
}