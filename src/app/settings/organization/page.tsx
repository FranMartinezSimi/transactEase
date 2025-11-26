"use client";

import { AuthenticatedLayout } from "@/shared/components/AuthenticatedLayout";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useEffect, useState } from "react";
import { Loader2, Building2, Settings, FileText, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Form schemas
const generalFormSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  domain: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
});

const limitsFormSchema = z.object({
  max_expiration_hours: z
    .number()
    .min(1, "Must be at least 1 hour")
    .max(8760, "Cannot exceed 1 year"),
  min_expiration_hours: z
    .number()
    .min(1, "Must be at least 1 hour")
    .max(8760, "Cannot exceed 1 year"),
  max_views: z.number().min(1, "Must be at least 1").max(1000),
  max_downloads: z.number().min(1, "Must be at least 1").max(1000),
});

type GeneralFormValues = z.infer<typeof generalFormSchema>;
type LimitsFormValues = z.infer<typeof limitsFormSchema>;

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  max_expiration_hours: number | null;
  min_expiration_hours: number | null;
  max_views: number | null;
  max_downloads: number | null;
}

export default function OrganizationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);

  // General form
  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      logo_url: "",
    },
  });

  // Limits form
  const limitsForm = useForm<LimitsFormValues>({
    resolver: zodResolver(limitsFormSchema),
    defaultValues: {
      max_expiration_hours: 168, // 7 days
      min_expiration_hours: 1,
      max_views: 10,
      max_downloads: 5,
    },
  });

  // Fetch organization settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/organization/settings");
        const data = await response.json();

        if (data.success && data.organization) {
          setOrganization(data.organization);

          // Update general form
          generalForm.reset({
            name: data.organization.name || "",
            domain: data.organization.domain || "",
            logo_url: data.organization.logo_url || "",
          });

          // Update limits form
          limitsForm.reset({
            max_expiration_hours: data.organization.max_expiration_hours || 168,
            min_expiration_hours: data.organization.min_expiration_hours || 1,
            max_views: data.organization.max_views || 10,
            max_downloads: data.organization.max_downloads || 5,
          });
        } else {
          toast.error("Failed to load organization settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Handle general form submit
  async function onGeneralSubmit(data: GeneralFormValues) {
    try {
      setIsSaving(true);
      const response = await fetch("/api/organization/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Organization settings updated");
        setOrganization(result.organization);
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle limits form submit
  async function onLimitsSubmit(data: LimitsFormValues) {
    // Validate min < max
    if (data.min_expiration_hours > data.max_expiration_hours) {
      toast.error("Minimum expiration cannot be greater than maximum");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/organization/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Delivery limits updated");
        setOrganization(result.organization);
      } else {
        toast.error(result.error || "Failed to update limits");
      }
    } catch (error) {
      console.error("Error updating limits:", error);
      toast.error("Failed to update limits");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization configuration and delivery defaults
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Building2 className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="limits">
              <Settings className="h-4 w-4 mr-2" />
              Delivery Limits
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form
                    onSubmit={generalForm.handleSubmit(onGeneralSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={generalForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ACME Corp" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Domain</FormLabel>
                          <FormControl>
                            <Input placeholder="company.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Users signing up with this domain will be automatically
                            added to your organization (SSO)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo.png"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL to your organization's logo image
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Limits Tab */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Limits</CardTitle>
                <CardDescription>
                  Set default limits for all deliveries in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...limitsForm}>
                  <form
                    onSubmit={limitsForm.handleSubmit(onLimitsSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={limitsForm.control}
                        name="min_expiration_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Expiration (hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum expiration time for deliveries
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={limitsForm.control}
                        name="max_expiration_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Expiration (hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum expiration time for deliveries
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={limitsForm.control}
                        name="max_views"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Views</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum number of views per delivery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={limitsForm.control}
                        name="max_downloads"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Downloads</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum number of downloads per delivery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Limits"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Templates</CardTitle>
                <CardDescription>
                  Create reusable templates for common delivery scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Templates Coming Soon</p>
                  <p className="text-sm">
                    This feature will allow you to create reusable delivery templates
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
