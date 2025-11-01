"use client"

import { useEffect, useRef } from "react";
import { X, Rocket } from "lucide-react";
import { trackModalOpen } from "@shared/lib/analytics";

interface WaitsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitsModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
            trackModalOpen();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            className="backdrop:bg-black/80 backdrop:backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-0 border-2 border-primary/20 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
            onClose={onClose}
            onClick={e => {
                if (e.target === dialogRef.current) onClose();
            }}
        >
            <div className="glass p-8 relative rounded-xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10 z-10"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center">
                    <Rocket className="h-8 w-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold mb-3 text-foreground text-center">
                    Join the Waitlist
                </h2>

                {/* Description */}
                <p className="mb-6 text-muted-foreground text-center">
                    Join the waitlist for exclusive early access
                </p>

                {/* Tally Form Embed */}
                <iframe
                    src="https://tally.so/embed/m6brGe?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                    width="100%"
                    height="400"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    title="Waitlist Form"
                    className="rounded-lg"
                ></iframe>
            </div>
        </dialog>
    );
}