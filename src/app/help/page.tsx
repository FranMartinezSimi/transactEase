"use client";

import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { MessageCircle, Mail, FileText, ExternalLink } from "lucide-react";
import { Button } from "@shared/components/ui/button";

export default function HelpPage() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Help & Support</h2>
          <p className="text-muted-foreground">
            Get help with Sealdrop or contact our support team
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>Get help from our team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Send us an email and we'll get back to you within 24 hours.
              </p>
              <Button className="w-full" asChild>
                <a href="mailto:support@sealdrop.xyz">
                  <Mail className="mr-2 h-4 w-4" />
                  support@sealdrop.xyz
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Live Chat</CardTitle>
                  <CardDescription>Chat with our support team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get instant help from our support team via live chat.
              </p>
              <Button className="w-full" variant="outline" disabled>
                <MessageCircle className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Documentation</CardTitle>
                  <CardDescription>Browse our guides</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Learn how to use Sealdrop with our comprehensive documentation.
              </p>
              <Button className="w-full" variant="outline" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Feature Request */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ExternalLink className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Feature Request</CardTitle>
                  <CardDescription>Suggest new features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Have an idea? Let us know what features you'd like to see.
              </p>
              <Button className="w-full" variant="outline" asChild>
                <a href="mailto:support@sealdrop.xyz?subject=Feature Request">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Send Request
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How do I send a secure delivery?</h4>
              <p className="text-sm text-muted-foreground">
                Click "Send Delivery" in the sidebar, fill in the recipient details, upload your files, and configure the security settings like expiration time and view limits.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What's the maximum file size?</h4>
              <p className="text-sm text-muted-foreground">
                The maximum file size depends on your plan. Early adopters can upload files up to 300MB.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How does the audit trail work?</h4>
              <p className="text-sm text-muted-foreground">
                Every access to your deliveries is logged with timestamp, IP address, location, and action type. Admins can view the complete audit log in the "Audit Log" section.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I revoke a delivery after sending?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Go to your Dashboard, find the delivery, and click "Revoke". The recipient will no longer be able to access the files.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
