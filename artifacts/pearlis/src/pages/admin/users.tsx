import { useListUsers } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const { data, isLoading } = useListUsers({ limit: 100 });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Users</h1>
      </div>

      <div className="bg-card border border-border p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium uppercase">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : user.name.charAt(0)}
                    </div>
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 uppercase tracking-widest ${user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
