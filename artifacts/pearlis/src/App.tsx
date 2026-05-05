import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandingApplicator } from "@/components/layout/BrandingApplicator";
import { Loader2 } from "lucide-react";
import { GoogleOAuthProvider } from "@react-oauth/google";
// Pages
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import Category from "@/pages/category";
import ProductDetail from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order";
import Wishlist from "@/pages/wishlist";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Account from "@/pages/account";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Gallery from "@/pages/gallery";
import BlogList from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Videos from "@/pages/videos";
import SearchPage from "@/pages/search";
import TrackOrder from "@/pages/track-order";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminUsers from "@/pages/admin/users";
import AdminBlogs from "@/pages/admin/blogs";
import AdminCoupons from "@/pages/admin/coupons";
import AdminSettings from "@/pages/admin/settings";
import AdminMessages from "@/pages/admin/messages";
import AdminPageContent from "@/pages/admin/page-content";
import AdminVideos from "@/pages/admin/videos";
import AdminCategories from "@/pages/admin/categories";
import AdminReviews from "@/pages/admin/reviews";
import AdminStockAlerts from "@/pages/admin/stock-alerts";
import AdminNewsletter from "@/pages/admin/newsletter";
import AdminReports from "@/pages/admin/reports";
import AdminReturns from "@/pages/admin/returns";
import AdminLoginPage from "@/pages/admin-login";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Admin guard
function AdminRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }
  if (!user || user.role !== "admin") {
    window.location.href = "/admin-login";
    return null;
  }
  return <Component />;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/order/:id" component={OrderDetail} />
      <Route path="/wishlist" component={Wishlist} />

      {/* Auth routes */}
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/login">{() => <Redirect to="/sign-in" />}</Route>
      <Route path="/register">{() => <Redirect to="/sign-up" />}</Route>

      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/account" component={Account} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:id" component={BlogPost} />
      <Route path="/videos" component={Videos} />
      <Route path="/search" component={SearchPage} />
      <Route path="/track-order" component={TrackOrder} />

      {/* Admin Routes */}
      <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/products">{() => <AdminRoute component={AdminProducts} />}</Route>
      <Route path="/admin/orders">{() => <AdminRoute component={AdminOrders} />}</Route>
      <Route path="/admin/users">{() => <AdminRoute component={AdminUsers} />}</Route>
      <Route path="/admin/blogs">{() => <AdminRoute component={AdminBlogs} />}</Route>
      <Route path="/admin/coupons">{() => <AdminRoute component={AdminCoupons} />}</Route>
      <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>
      <Route path="/admin/messages">{() => <AdminRoute component={AdminMessages} />}</Route>
      <Route path="/admin/page-content">{() => <AdminRoute component={AdminPageContent} />}</Route>
      <Route path="/admin/videos">{() => <AdminRoute component={AdminVideos} />}</Route>
      <Route path="/admin/categories">{() => <AdminRoute component={AdminCategories} />}</Route>
      <Route path="/admin/reviews">{() => <AdminRoute component={AdminReviews} />}</Route>
      <Route path="/admin/stock-alerts">{() => <AdminRoute component={AdminStockAlerts} />}</Route>
      <Route path="/admin/newsletter">{() => <AdminRoute component={AdminNewsletter} />}</Route>
      <Route path="/admin/reports">{() => <AdminRoute component={AdminReports} />}</Route>
      <Route path="/admin/returns">{() => <AdminRoute component={AdminReturns} />}</Route>
      <Route path="/admin-login" component={AdminLoginPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrandingApplicator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "google-oauth-not-configured"}>
      <WouterRouter base={basePath}>
        <AppWithProviders />
      </WouterRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
