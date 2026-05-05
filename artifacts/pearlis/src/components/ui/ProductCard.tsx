import { Link, useLocation } from "wouter";
import { Product, useAddToCart, useAddToWishlist, useRemoveFromWishlist, useGetWishlist, getGetCartQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingBag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCardProps {
  product: Product;
  index?: number;
  showCartButton?: boolean;
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

  const isWishlisted = wishlist?.some((w: any) => w.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: (updatedCart) => {
          queryClient.setQueryData(getGetCartQueryKey(), updatedCart);
          toast({ title: "Added to bag", description: product.name });
        },
        onError: () => toast({ title: "Could not add to bag", variant: "destructive" }),
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
    if (isWishlisted) {
      removeFromWishlist.mutate({ productId: product.id }, {
        onSuccess: () => toast({ title: "Removed from wishlist" }),
      });
    } else {
      addToWishlist.mutate({ productId: product.id }, {
        onSuccess: () => toast({ title: "Saved to wishlist", description: product.name }),
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

          {/* Wishlist heart */}
          <button
            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-md ${
              isWishlisted
                ? "bg-[#D4AF37] text-white opacity-100"
                : "bg-white/90 text-[#0F0F0F] opacity-0 group-hover:opacity-100 hover:bg-[#D4AF37] hover:text-white"
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

          {/* Hover overlay — Add to Cart */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            {showCartButton ? (
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock === 0}
                className="w-full bg-[#0F0F0F]/95 backdrop-blur-sm text-white py-2.5 text-center text-[9px] font-bold tracking-[0.22em] uppercase hover:bg-[#D4AF37] transition-colors duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {addToCart.isPending
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <ShoppingBag className="w-3 h-3" />
                }
                {product.stock === 0 ? "Sold Out" : "Add to Bag"}
              </button>
            ) : (
              <div className="bg-[#0F0F0F]/95 backdrop-blur-sm text-white py-2.5 text-center text-[9px] font-bold tracking-[0.25em] uppercase hover:bg-[#D4AF37] transition-colors duration-200">
                View Details
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Product info */}
      <div className="flex flex-col gap-1 px-0.5">
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
      </div>
    </motion.div>
  );
}
