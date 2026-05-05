import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Download, Search, Mail, Users } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, adminHeaders } from "@/lib/apiUrl";

type Subscriber = {
  id: number;
  email: string;
  subscribedAt: string;
};

async function fetchSubscribers(): Promise<Subscriber[]> {
  const res = await fetch(apiUrl("/api/admin/newsletter"), { headers: adminHeaders() });
  if (!res.ok) throw new Error("Failed to fetch subscribers");
  return res.json();
}

async function deleteSubscriber(id: number) {
  const res = await fetch(apiUrl(`/api/admin/newsletter/${id}`), {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete");
}

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: fetchSubscribers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-newsletter"] });
      toast({ title: "Subscriber removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setDeleting(null),
  });

  const subscribers = data ?? [];
  const filtered = search.trim()
    ? subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))
    : subscribers;

  function handleDelete(id: number, email: string) {
    if (!confirm(`Remove ${email} from the newsletter list?`)) return;
    setDeleting(id);
    deleteMutation.mutate(id);
  }

  function exportCSV() {
    const rows = ["Email,Subscribed At", ...subscribers.map(s =>
      `${s.email},${format(new Date(s.subscribedAt), "yyyy-MM-dd HH:mm")}`
    )];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Newsletter</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {subscribers.length} {subscribers.length === 1 ? "subscriber" : "subscribers"}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={subscribers.length === 0}
            className="gap-2 text-xs tracking-widest uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border p-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Total Subscribers</p>
          <p className="font-serif text-3xl">{subscribers.length}</p>
        </div>
        <div className="bg-card border border-border p-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">This Month</p>
          <p className="font-serif text-3xl">
            {subscribers.filter(s => {
              const d = new Date(s.subscribedAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-card border border-border p-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">This Week</p>
          <p className="font-serif text-3xl">
            {subscribers.filter(s => {
              const d = new Date(s.subscribedAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Mail className="w-10 h-10 text-muted-foreground/30" strokeWidth={1} />
            <p className="text-muted-foreground text-sm">
              {search ? "No subscribers match your search." : "No subscribers yet. Share your site to grow the list!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="whitespace-nowrap">#</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Subscribed</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub, idx) => (
                <TableRow key={sub.id} className="border-border">
                  <TableCell className="text-muted-foreground text-xs w-12">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3 h-3 text-accent" />
                      </div>
                      <span className="font-medium text-sm">{sub.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(sub.subscribedAt), "MMM d, yyyy")}
                    <span className="text-xs text-muted-foreground/50 ml-1.5">
                      {format(new Date(sub.subscribedAt), "h:mm a")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sub.id, sub.email)}
                      disabled={deleting === sub.id}
                      className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deleting === sub.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <><Trash2 className="w-3.5 h-3.5" />Remove</>
                      }
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
