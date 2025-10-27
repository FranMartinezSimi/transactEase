"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does end-to-end encryption work?",
    answer:
      "Your files are encrypted on your device before being uploaded to our servers. Only the recipient with the unique access link can decrypt and view the files. We never have access to your unencrypted data.",
  },
  {
    question: "What happens when files self-destruct?",
    answer:
      "Files are automatically and permanently deleted from our servers after they expire, reach their view limit, or download limit. This ensures sensitive data doesn't persist longer than necessary, helping you maintain compliance and control.",
  },
  {
    question: "Can I control who accesses my files?",
    answer:
      "Yes! You can set email whitelists/blacklists, restrict access to specific domains, limit IP addresses, and configure view/download limits. You have complete control over who can access your shared files.",
  },
  {
    question: "How does the audit trail work?",
    answer:
      "Every action is logged with timestamps, IP addresses, and user details. You can see exactly when files were viewed, downloaded, or accessed, providing complete transparency and compliance documentation.",
  },
  {
    question: "What makes Sealdrop different from Dropbox or Google Drive?",
    answer:
      "Unlike permanent storage solutions, Sealdrop is designed for temporary, secure file sharing. Files self-destruct, access is granularly controlled, and every action is audited. It's built for compliance-focused businesses that need to prove they don't retain sensitive data.",
  },
  {
    question: "Is my data stored permanently on your servers?",
    answer:
      "No. Sealdrop uses ephemeral storage - files are automatically deleted after expiration or when access limits are reached. We don't retain your data, which helps you stay compliant with data protection regulations.",
  },
  {
    question: "What industries benefit from Sealdrop?",
    answer:
      "Financial services, healthcare, legal firms, compliance teams, and any business handling sensitive information. If you need to share files securely without leaving a permanent digital footprint, Sealdrop is for you.",
  },
  {
    question: "Can I customize security policies for my organization?",
    answer:
      "Absolutely. You can configure email/IP whitelists and blacklists, set expiration limits, restrict access to internal domains only, and customize security policies to match your organization's compliance requirements.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-20 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about secure file sharing
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden bg-card transition-all hover:border-primary/50"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 pt-2 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@sealdrop.com"
            className="text-primary hover:underline font-medium"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
