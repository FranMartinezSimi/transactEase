"use client";

import { AuthenticatedLayout } from "@/shared/components/AuthenticatedLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormItem, FormLabel } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
    emailDomain: z.string().email(),
});

export default function OrganizationPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailDomain, setEmailDomain] = useState("");

    const handleDomainSubmit = (data: any) => {
        setEmailDomain(data.emailDomain);
    }
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col gap-4">
                <h1>Organization</h1>
                <p>Manage your organization email domain</p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleDomainSubmit)} className="space-y-6">
                        <FormItem>
                            <FormLabel>Email Domain</FormLabel>
                            <FormControl>
                                <Input type="text" {...form.register("emailDomain")} />
                            </FormControl>
                        </FormItem>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                    </form>
                </Form>
            </div>
        </AuthenticatedLayout>
    );
}