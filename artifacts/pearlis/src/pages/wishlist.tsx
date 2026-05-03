import {
  useGetWishlist,
  useRemoveFromWishlist,
  useAddToCart,
  getGetCartQueryKey,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Heart, ShoppingBag, X, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const INR = (n: number) => "₹" + Math.round(n * 83).toLocaleString("en-IN");

export default function Wishlist() {
  const { user } = useAuth();
  const { data: wishlist, isLoading } = useGetWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMoveToCart = (item: any) => {
    addToCart.mutate(
      { data: { productId: item.id, quantity: 1 } },
      {
        onSuccess: (updatedCart) => {
          queryClient.setQueryData(getGetCartQueryKey(), updatedCart);
          removeFromWishlist.mutate(
            { productId: item.id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
                toast({ title: "Moved to bag", description: item.name });
              },
            }
          );
        },
        onError: () =>
          toast({ title: "Could not add to bag", variant: "destructive" }),
      }
    );
  };

  const handleRemove = (item: any) => {
    removeFromWishlist.mutate(
      { productId: item.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          toast({ title: "Removed from wishlist" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />

      <div className="pt-24 pb-24 max-w-[1440px] mx-auto px-4 md:px-8 w-full flex-1">
        <BackButton className="mb-6" />

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">My Account</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#0F0F0F]">
              {user ? `Welcome, ${user.name?.split(" ")[0]}` : "My Wishlist"}
            </h1>
          </div>
          {wishlist && wishlist.length > 0 && (
            <span className="text-sm text-[#0F0F0F]/40 tracking-wide">
              {wishlist.length} saved {wishlist.length === 1 ? "piece" : "pieces"}
            </span>
          )}
        </div>

        {/* Account nav tabs */}
        {user && (
          <div className="flex gap-8 mb-12 border-b border-[#D4AF37]/20">
            <Link href="/orders" className="pb-4 border-b-2 border-transparent text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors font-medium tracking-[0.18em] uppercase text-[11px]">
              Order History
            </Link>
            <div className="pb-4 border-b-2 border-[#D4AF37] text-[#0F0F0F] font-medium tracking-[0.18em] uppercase text-[11px]">
              Wishlist
            </div>
          </div>
        )}

        {/* States */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-[#0F0F0F] mb-3">Your wishlist is empty</h2>
            <p className="text-[#0F0F0F]/45 text-sm mb-8 max-w-xs leading-relaxed">
              Browse our collection and tap the heart icon on any product to save it here.
            </p>
            <Link href="/shop">
              <button className="rounded-none uppercase tracking-[0.2em] text-[11px] px-10 py-3 h-auto bg-[#0F0F0F] text-white hover:bg-[#D4AF37] hover:text-[#0F0F0F] transition-colors inline-flex items-center gap-2">
                Discover Jewellery <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            <AnimatePresence initial={false}>
              {(wishlist as any[]).map((item: any, index: number) => {
                const img = item.images?.[0] || "https://images.unsplash.com/photo-1573408301185-9519f94815b5?auto=format&fit=crop&q=85&w=400";
                const price = item.discountPrice && item.discountPrice < item.price
                  ? item.discountPrice
                  : item.price;
                const originalPrice = item.price;
                const hasDiscount = item.discountPrice && item.discountPrice < item.price;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="flex gap-4 sm:gap-6 items-start border-b border-[#0F0F0F]/7 py-6"
                  >
                    {/* Image */}
                    <Link href={`/product/${item.id}`} className="shrink-0">
                      <div className="w-24 h-28 sm:w-32 sm:h-40 overflow-hidden bg-[#F0EDE6] group">
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-3 py-1">
                      {item.category && (
                        <p className="text-[8px] tracking-[0.25em] uppercase text-[#D4AF37] font-semibold">{item.category}</p>
                      )}
                      <Link href={`/product/${item.id}`}>
                        <h3 className="font-serif text-base sm:text-lg text-[#0F0F0F] leading-snug hover:text-[#D4AF37] transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-[#0F0F0F] text-sm sm:text-base">{INR(price)}</span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-[#0F0F0F]/30 line-through">{INR(originalPrice)}</span>
                            <span className="text-[9px] tracking-[0.1em] uppercase bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 font-bold">
                              Save {Math.round((1 - price / originalPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Stock badge */}
                      {item.stock === 0 && (
                        <span className="text-[8px] tracking-[0.15em] uppercase text-[#0F0F0F]/40 border border-[#0F0F0F]/15 px-2 py-0.5 w-fit">Made to Order</span>
                      )}
                      {item.stock > 0 && item.stock < 5 && (
                        <span className="text-[8px] tracking-[0.15em] uppercase text-red-500 border border-red-200 px-2 py-0.5 w-fit">Only {item.stock} left</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                        <button
                          onClick={() => handleMoveToCart(item)}
                          disabled={addToCart.isPending}
                          className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#0F0F0F] text-white text-[9px] tracking-[0.2em] uppercase font-bold hover:bg-[#D4AF37] hover:text-[#0F0F0F] transition-colors disabled:opacity-50"
                        >
                          {addToCart.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShoppingBag className="w-3 h-3" />
                          )}
                          Move to Bag
                        </button>

                        <Link href={`/product/${item.id}`}>
                          <button className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border border-[#0F0F0F]/15 text-[#0F0F0F]/60 text-[9px] tracking-[0.2em] uppercase font-bold hover:border-[#D4AF37] hover:text-[#0F0F0F] transition-colors">
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={removeFromWishlist.isPending}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-[#0F0F0F]/25 hover:text-[#0F0F0F]/70 transition-colors mt-1"
                      title="Remove from wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Bottom CTA */}
            <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-[#0F0F0F]/40 tracking-wide">
                Items in your wishlist are not reserved — add to bag to secure them.
              </p>
              <Link href="/shop">
                <button className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#D4AF37] hover:text-[#0F0F0F] transition-colors">
                  Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
