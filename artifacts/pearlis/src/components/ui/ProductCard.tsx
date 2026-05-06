import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Product, useAddToCart, useAddToWishlist, useRemoveFromWishlist, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, ShoppingBag, Check, Zap, Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/apiUrl";

interface ProductCardProps {
  product: Product;
  index?: number;
  showCartButton?: boolean;
}

/* ── Inline notify-me widget for out-of-stock cards ── */
function CardNotifyMe({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/stock-alerts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Could not subscribe", description: data.error || "Try again.", variant: "destructive" });
        return;
      }
      setDone(true);
    } catch {
      toast({ title: "Network error", description: "Check your connection.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [email, productId, toast]);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="w-full py-2.5 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold tracking-[0.18em] uppercase"
      >
        <Check className="w-3 h-3" /> We'll notify you!
      </motion.div>
    );
  }

  return (
    <div onClick={e => e.preventDefault()}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="bell-btn"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
            className="w-full py-2.5 flex items-center justify-center gap-1.5 border border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/12 text-[9px] font-bold tracking-[0.22em] uppercase transition-all duration-200"
          >
            <Bell className="w-3 h-3" strokeWidth={2} />
            Notify Me When Available
          </motion.button>
        ) : (
          <motion.form
            key="email-form"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex gap-1"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none px-2.5 py-2 text-[11px] text-[#0F0F0F] placeholder:text-[#0F0F0F]/30 bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex-shrink-0 bg-[#D4AF37] hover:bg-[#c4a030] text-white text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-2 transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

const INR = (n: number) => `₹${Math.round(n * 83).toLocaleString("en-IN")}`;

export function ProductCard({ product, index = 0, showCartButton = true }: ProductCardProps) {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: wishlist } = useGetWishlist({ query: { enabled: !!user } });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cartFlash, setCartFlash] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const isWishlisted = wishlist?.some((w: any) => w.id === product.id);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartFlash(true);
    toast({ title: "Added to bag", description: product.name });
    setTimeout(() => setCartFlash(false), 1800);
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: (updatedCart) => {
          queryClient.setQueryData(getGetCartQueryKey(), updatedCart);
        },
        onError: () => {
          setCartFlash(false);
          toast({ title: "Could not add to bag", variant: "destructive" });
        },
      }
    );
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setBuyNowLoading(true);
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: (updatedCart) => {
          queryClient.setQueryData(getGetCartQueryKey(), updatedCart);
          setLocation("/checkout");
        },
        onError: () => {
          setBuyNowLoading(false);
          toast({ title: "Could not process", variant: "destructive" });
        },
      }
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setLocation(`/sign-in?redirect=/product/${product.id}`);
      return;
    }
    const wishlistKey = getGetWishlistQueryKey();
    const prev = queryClient.getQueryData<any[]>(wishlistKey) ?? [];
    if (isWishlisted) {
      queryClient.setQueryData(wishlistKey, prev.filter((w: any) => w.id !== product.id));
      removeFromWishlist.mutate({ productId: product.id }, {
        onError: () => queryClient.setQueryData(wishlistKey, prev),
      });
    } else {
      queryClient.setQueryData(wishlistKey, [...prev, { id: product.id, ...product }]);
      toast({ title: "Saved to wishlist", description: product.name });
      addToWishlist.mutate({ productId: product.id }, {
        onError: () => {
          queryClient.setQueryData(wishlistKey, prev);
          toast({ title: "Could not save", variant: "destructive" });
        },
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative flex flex-col"
    >
      {/* Image container */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F0E8] mb-3 cursor-pointer">
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-[#0F0F0F] text-white text-[8px] font-bold px-2 py-[3px] tracking-[0.15em] uppercase">
                New
              </span>
            )}
            {hasDiscount && (
              <span className="bg-[#D4AF37] text-white text-[8px] font-bold px-2 py-[3px] tracking-[0.15em] uppercase">
                -{discountPct}%
              </span>
            )}
            {product.isTrending && !product.isNew && !hasDiscount && (
              <span className="bg-rose-600 text-white text-[8px] font-bold px-2 py-[3px] tracking-[0.12em] uppercase">
                Hot
              </span>
            )}
          </div>

          {/* Wishlist heart — always visible */}
          <button
            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-md ${
              isWishlisted
                ? "bg-[#D4AF37] text-white scale-110"
                : "bg-white/90 text-[#0F0F0F] hover:bg-[#D4AF37] hover:text-white"
            }`}
            onClick={handleWishlist}
          >
            <Heart className="w-3 h-3" strokeWidth={1.8} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* Product images */}
          <div className="w-full h-full relative overflow-hidden">
            <img
              src={product.images?.[0] || "https://images.unsplash.com/photo-1599643478524-fb66f70d00f7?auto=format&fit=crop&q=80&w=600"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
              loading="lazy"
            />
            {product.images?.[1] && (
              <img
                src={product.images[1]}
                alt={`${product.name} alt`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </div>

          {/* Desktop hover overlay — Add to Cart */}
          {showCartButton && (
            <div className="hidden md:block absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-2.5 text-center text-[9px] font-bold tracking-[0.22em] uppercase transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                  cartFlash
                    ? "bg-[#D4AF37] text-white"
                    : isOutOfStock
                      ? "bg-[#0F0F0F]/50 backdrop-blur-sm text-white/50 cursor-not-allowed"
                      : "bg-[#0F0F0F]/95 backdrop-blur-sm text-white hover:bg-[#D4AF37]"
                }`}
              >
                {cartFlash ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                {cartFlash ? "Added" : isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="flex flex-col gap-1 px-0.5 flex-1">
        <p className="text-[8.5px] tracking-[0.22em] uppercase text-[#D4AF37] font-semibold">
          {product.material || "Fine Jewellery"}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif text-[14px] sm:text-[15px] text-[#0F0F0F] hover:text-[#D4AF37] transition-colors cursor-pointer leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5"
                fill={i < Math.round(product.rating) ? "#D4AF37" : "none"}
                stroke="#D4AF37"
                strokeWidth={1.5}
              />
            ))}
            <span className="text-[9px] text-[#0F0F0F]/40 ml-0.5">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          {hasDiscount ? (
            <>
              <span className="text-[#0F0F0F] font-semibold text-sm">{INR(product.discountPrice!)}</span>
              <span className="text-[#0F0F0F]/35 line-through text-xs">{INR(product.price)}</span>
            </>
          ) : (
            <span className="text-[#0F0F0F] font-semibold text-sm">{INR(product.price)}</span>
          )}
        </div>

        {/* Action buttons — always visible */}
        {showCartButton && (
          <div className="mt-2.5 space-y-1.5">
            {isOutOfStock ? (
              /* Out of stock: Notify Me widget */
              <CardNotifyMe productId={product.id} />
            ) : (
              <>
                {/* Buy Now — gold CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyNow}
                  disabled={buyNowLoading}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase transition-all duration-200 bg-[#D4AF37] text-white hover:bg-[#C9A227] shadow-[0_2px_12px_rgba(212,175,55,0.35)] hover:shadow-[0_4px_18px_rgba(212,175,55,0.5)] disabled:opacity-60"
                >
                  {buyNowLoading ? (
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" strokeWidth={2.5} />
                  )}
                  {buyNowLoading ? "Processing…" : "Buy Now"}
                </motion.button>

                {/* Add to Cart + Wishlist row */}
                <div className="flex gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    className={`flex-1 py-2 border text-[9px] font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      cartFlash
                        ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#D4AF37]"
                        : "border-[#0F0F0F]/15 text-[#0F0F0F]/55 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    }`}
                  >
                    {cartFlash ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {cartFlash ? "Added!" : "Add to Bag"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWishlist}
                    className={`w-9 border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      isWishlisted
                        ? "border-[#D4AF37] bg-[#D4AF37]/8 text-[#D4AF37]"
                        : "border-[#0F0F0F]/15 text-[#0F0F0F]/40 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.8} />
                  </motion.button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
