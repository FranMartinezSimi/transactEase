import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: "Sealdrop <noreply@sealdrop.xyz>",
  fromName: "Sealdrop",
};
