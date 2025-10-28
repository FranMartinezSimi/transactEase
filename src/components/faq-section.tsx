"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What happens if someone tries to guess the password?",
    answer:
      "After 2-3 failed login attempts, the file, temporary user account, and all credentials are automatically destroyed. No recovery possible. The sender gets notified immediately, and everything is logged in the audit trail. This prevents brute force attacks.",
  },
  {
    question: "What's a temporary user with a 4-digit token?",
    answer:
      "When you share a file externally, the recipient gets a single-use account with a unique 4-digit token (not a password they can forget). No sign-up, no password recovery, no second chances. Once they access the file or the link expires, the account self-destructs.",
  },
  {
    question: "Why is IP logging mandatory?",
    answer:
      "For forensic-grade compliance. Every file access is logged with IP address, timestamp, device info, and action taken. This creates an immutable audit trail for legal/compliance teams. Even if someone uses a VPN, their access is still logged and traceable.",
  },
  {
    question: "How is this different from WeTransfer or SendSafely?",
    answer:
      "WeTransfer has zero audit trail and no access control. SendSafely costs $300+/month for enterprise features. Sealdrop gives you auto-destruction on failed attempts, forensic audit logs, temporary users with tokens, and mandatory IP tracking at SMB pricing ($29-99/month).",
  },
  {
    question: "Is my data stored permanently on your servers?",
    answer:
      "No. Files self-destruct after expiration, view/download limits, or failed login attempts. We use ephemeral storage with automatic deletion. Your data doesn't persist, which helps with GDPR, HIPAA, and SOC 2 compliance requirements.",
  },
  {
    question: "Who is Sealdrop built for?",
    answer:
      "Compliance teams, legal firms, financial services, HR departments, healthcare providers, and any business handling sensitive documents that need proof of who accessed what, when, and from where. If you need audit trails and auto-destruction, Sealdrop is for you.",
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
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                    }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-96" : "max-h-0"
                  }`}
              >
                <div className="px-6 pb-4 pt-2 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
