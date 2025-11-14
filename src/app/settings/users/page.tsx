"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Input } from "@shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  } from "@shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Label } from "@shared/components/ui/label";
import { UserPlus, Loader2, Trash2, Shield, Search } from "lucide-react";
import { useProfile } from "@features/auth/hooks/useProfile";
import { toast } from "sonner";

interface OrganizationMember {
  id: string
  email: string
  full_name: string | null
  role: "owner" | "admin" | "member"
  is_active: boolean
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState<"admin" | "member">("member")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwner = profile?.role === "owner"
  const isAdmin = profile?.role === "admin" || profile?.role === "owner"

  useEffect(() => {
    if (!profileLoading && profile) {
      fetchMembers()
    }
  }, [profileLoading, profile])

  const fetchMembers = async () => {
    try {
      console.log("[Users] Fetching members...")
      setLoading(true)
      const response = await fetch("/api/organization/members")
      console.log("[Users] Response status:", response.status)
      const data = await response.json()
      console.log("[Users] Response data:", data)

      if (response.ok && data.success) {
        console.log("[Users] Members loaded successfully:", data.members.length)
        setMembers(data.members)
      } else {
        console.error("[Users] Failed to load members:", data.error)
        toast.error(data.error || "Failed to load members")
      }
    } catch (error) {
      console.error("[Users] Error fetching members:", error)
      toast.error("An error occurred while loading members")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    // TODO: Validate email domain matches organization domain
    // For now in development, we skip this validation

    try {
      setIsSubmitting(true)
      const payload = {
        email: newUserEmail.trim().toLowerCase(),
        full_name: newUserName.trim() || null,
        role: newUserRole,
      }
      console.log("[Users] Adding user with payload:", payload)

      const response = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[Users] Add user response status:", response.status)
      const data = await response.json()
      console.log("[Users] Add user response data:", data)

      if (response.ok && data.success) {
        const message = data.requiresRegistration
          ? `${newUserEmail} registered. They'll be added when they sign in with SSO.`
          : "User added successfully"
        console.log("[Users] User added successfully:", message)
        toast.success(message)
        setIsAddDialogOpen(false)
        setNewUserEmail("")
        setNewUserName("")
        setNewUserRole("member")
        fetchMembers()
      } else {
        console.error("[Users] Failed to add user:", data.error)
        toast.error(data.error || "Failed to add user")
      }
    } catch (error) {
      console.error("[Users] Error adding user:", error)
      toast.error("An error occurred while adding user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: "admin" | "member") => {
    try {
      console.log("[Users] Changing role for user:", userId, "to:", newRole)
      const response = await fetch(`/api/organization/members/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      console.log("[Users] Change role response status:", response.status)
      const data = await response.json()
      console.log("[Users] Change role response data:", data)

      if (response.ok && data.success) {
        console.log("[Users] Role updated successfully")
        toast.success("Role updated successfully")
        fetchMembers()
      } else {
        console.error("[Users] Failed to update role:", data.error)
        toast.error(data.error || "Failed to update role")
      }
    } catch (error) {
      console.error("[Users] Error changing role:", error)
      toast.error("An error occurred while updating role")
    }
  }

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} from the organization?`)) {
      return
    }

    try {
      console.log("[Users] Removing user:", userId, userEmail)
      const response = await fetch(`/api/organization/members/${userId}`, {
        method: "DELETE",
      })

      console.log("[Users] Remove user response status:", response.status)
      const data = await response.json()
      console.log("[Users] Remove user response data:", data)

      if (response.ok && data.success) {
        console.log("[Users] User removed successfully")
        toast.success("User removed successfully")
        fetchMembers()
      } else {
        console.error("[Users] Failed to remove user:", data.error)
        toast.error(data.error || "Failed to remove user")
      }
    } catch (error) {
      console.error("[Users] Error removing user:", error)
      toast.error("An error occurred while removing user")
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      case "member":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Only admin and owner can access this page
  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your organization's team members and their roles
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Organization Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? "member" : "members"} in your organization
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Register a team member by email. They will be automatically added to your organization when they sign in with SSO.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Email domain must match your organization's domain. User will be auto-assigned when they sign in with SSO.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name (Optional)</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Optional - for reference only
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newUserRole}
                          onValueChange={(value) => setNewUserRole(value as "admin" | "member")}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Members can only view their own deliveries. Admins can view all
                          deliveries and manage team members.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddUser} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Member"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Members Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No members found matching your search" : "No members yet"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || "—"}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Only owner can be changed by owner */}
                            {member.role !== "owner" && (
                              <>
                                <Select
                                  value={member.role}
                                  onValueChange={(value) =>
                                    handleChangeRole(member.id, value as "admin" | "member")
                                  }
                                  disabled={!isOwner && member.role === "admin"}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveUser(member.id, member.email)}
                                  disabled={member.id === profile?.id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            {member.role === "owner" && (
                              <p className="text-xs text-muted-foreground">
                                Cannot modify owner
                              </p>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <span className="font-semibold">Owner:</span> Full access, manages subscription
              </div>
              <div>
                <span className="font-semibold">Admin:</span> Can view all deliveries, manage team
              </div>
              <div>
                <span className="font-semibold">Member:</span> Can only view own deliveries
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <div>• Only one owner per organization</div>
              <div>• Owner is the one who creates the subscription</div>
              <div>• Users are auto-added when they sign in with SSO</div>
              <div>• Email domain must match organization domain</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
