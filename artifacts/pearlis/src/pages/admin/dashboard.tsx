import { useGetDashboardStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Loader2, IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fmt = (usd: number) => `₹${Math.round(usd * 83).toLocaleString("en-IN")}`;

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-none border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime orders value</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Orders</CardTitle>
            <Package className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.pendingOrders || 0} pending</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Products</CardTitle>
            <ShoppingBag className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In catalogue</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Customers</CardTitle>
            <Users className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
