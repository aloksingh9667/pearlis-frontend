import { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";
import { getListUsersQueryKey } from "@workspace/api-client-react";

export default function AdminUsers() {
  const { data, isLoading } = useListUsers({ limit: 200 });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  const users = data?.users ?? [];
  const filtered = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  async function toggleRole(userId: number, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    setToggling(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}/role`), {
        method: "PATCH",
        headers: adminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update role");
      }
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "Role Updated", description: `User is now ${newRole}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} registered {users.length === 1 ? "user" : "users"}
            {" · "}
            {users.filter(u => u.role === "admin").length} admin{users.filter(u => u.role === "admin").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card border border-border p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium uppercase flex-shrink-0 overflow-hidden">
                        {user.avatar
                          ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                          : user.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[140px]">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 uppercase tracking-widest ${
                      user.role === "admin"
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={toggling === user.id}
                      className={`gap-1.5 text-xs ${
                        user.role === "admin"
                          ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                          : "text-accent hover:text-accent hover:bg-accent/10"
                      }`}
                    >
                      {toggling === user.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : user.role === "admin" ? (
                        <><ShieldOff className="w-3.5 h-3.5" />Revoke Admin</>
                      ) : (
                        <><ShieldCheck className="w-3.5 h-3.5" />Make Admin</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
