import { useGetCart, useRemoveFromCart, useUpdateCartItem, useGetMe, getGetCartQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Truck } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const INR = (n: number) => `₹${Math.round(n * 83).toLocaleString("en-IN")}`;

export default function Cart() {
  const [, setLocation] = useLocation();
  const { data: cart, isLoading } = useGetCart();
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const handleUpdateQty = (productId: number, quantity: number) => {
    if (quantity < 1) {
      handleRemove(productId);
      return;
    }
    updateItem.mutate({ productId, data: { quantity } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    });
  };

  const handleRemove = (productId: number) => {
    removeItem.mutate({ productId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
    });
  };

  const handleCheckout = () => {
    if (!user) setLocation("/login?redirect=/checkout");
    else setLocation("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-[1200px] mx-auto px-4 md:px-8 pt-24 pb-24 w-full">
        <BackButton className="mb-4" />
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-bold mb-2">Your Selection</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#0F0F0F]">Shopping Bag</h1>
          <div className="w-10 h-[2px] bg-[#D4AF37] mt-3" />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-28 bg-[#E8E2D9]/40 animate-pulse" />)}
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-[#D4AF37]/12">
            <ShoppingBag className="w-12 h-12 text-[#D4AF37]/40 mb-6" strokeWidth={1} />
            <p className="font-serif text-2xl text-[#0F0F0F] mb-2">Your bag is empty</p>
            <p className="text-[#0F0F0F]/45 text-sm mb-8">Discover our handcrafted fine jewellery collection</p>
            <Link href="/shop">
              <button className="bg-[#0F0F0F] hover:bg-[#D4AF37] text-white px-10 py-3.5 text-[10px] tracking-[0.28em] uppercase font-bold transition-colors duration-300">
                Explore Collections
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Items */}
            <div className="flex-1 min-w-0">
              {/* Column headers — desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[#0F0F0F]/8 text-[9px] tracking-[0.25em] uppercase text-[#0F0F0F]/40 font-bold mb-2">
                <div className="col-span-6">Item</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              <AnimatePresence>
                {cart.items.map((item) => {
                  const unitPrice = item.product.discountPrice || item.product.price;
                  return (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-6 border-b border-[#0F0F0F]/8"
                    >
                      {/* Product */}
                      <div className="md:col-span-6 flex gap-4 items-start">
                        <Link href={`/product/${item.productId}`}>
                          <img
                            src={item.product.images?.[0]}
                            alt={item.product.name}
                            className="w-20 h-26 object-cover bg-[#F0EDE6] flex-shrink-0"
                            style={{ aspectRatio: "3/4" }}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] tracking-[0.22em] uppercase text-[#D4AF37] font-semibold mb-1">
                            {item.product.material || "Fine Jewellery"}
                          </p>
                          <Link href={`/product/${item.productId}`}>
                            <h3 className="font-serif text-base md:text-lg text-[#0F0F0F] hover:text-[#D4AF37] transition-colors leading-snug mb-2 cursor-pointer">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-[#0F0F0F]/55 text-sm font-medium">{INR(unitPrice)}</p>
                          {/* Mobile qty */}
                          <div className="flex items-center gap-3 mt-3 md:hidden">
                            <div className="flex items-center border border-[#0F0F0F]/15">
                              <button className="w-8 h-8 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors" onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}>
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <button className="w-8 h-8 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors" onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-[#0F0F0F]">{INR(unitPrice * item.quantity)}</span>
                            <button className="ml-auto text-[#0F0F0F]/30 hover:text-red-500 transition-colors" onClick={() => handleRemove(item.productId)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Qty — desktop */}
                      <div className="hidden md:flex md:col-span-3 justify-center">
                        <div className="flex items-center border border-[#0F0F0F]/15">
                          <button className="w-9 h-9 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors" onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-9 h-9 flex items-center justify-center text-sm font-medium border-x border-[#0F0F0F]/15">{item.quantity}</span>
                          <button className="w-9 h-9 flex items-center justify-center hover:bg-[#0F0F0F]/5 transition-colors" onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Total — desktop */}
                      <div className="hidden md:flex md:col-span-3 justify-end items-center gap-4">
                        <span className="font-semibold text-[#0F0F0F]">{INR(unitPrice * item.quantity)}</span>
                        <button className="text-[#0F0F0F]/25 hover:text-red-500 transition-colors" onClick={() => handleRemove(item.productId)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>

            {/* Order summary */}
            <div className="lg:w-[340px] flex-shrink-0">
              <div className="bg-white border border-[#D4AF37]/15 p-7 sticky top-[110px]">
                <h2 className="font-serif text-xl text-[#0F0F0F] mb-6">Order Summary</h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#0F0F0F]/50">Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-medium">{INR(cart.subtotal)}</span>
                  </div>
                  {cart.discount != null && cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>−{INR(cart.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#0F0F0F]/50">
                    <span>Shipping</span>
                    <span className={cart.subtotal * 83 >= 5000 ? "text-emerald-600 font-medium" : ""}>
                      {cart.subtotal * 83 >= 5000 ? "Free" : "Calculated at checkout"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0F0F0F]/40 text-xs pt-1">
                    <span>GST (3% on jewellery)</span>
                    <span>{INR(cart.total * 0.03)}</span>
                  </div>
                </div>

                <div className="border-t border-[#D4AF37]/15 pt-4 flex justify-between items-center mb-6">
                  <span className="font-serif text-lg text-[#0F0F0F]">Total</span>
                  <span className="font-serif text-xl text-[#D4AF37]">{INR(cart.total * 1.03)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="group w-full bg-[#0F0F0F] hover:bg-[#D4AF37] text-white py-4 text-[10px] tracking-[0.3em] uppercase font-extrabold transition-colors duration-300 flex items-center justify-center gap-2 mb-4"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Trust */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-[9.5px] text-[#0F0F0F]/40">
                    <Shield className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                    Secure 256-bit SSL encrypted checkout
                  </div>
                  <div className="flex items-center gap-2 text-[9.5px] text-[#0F0F0F]/40">
                    <Truck className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                    Free shipping on orders above ₹5,000
                  </div>
                </div>

                {/* Coupon hint */}
                <div className="mt-5 pt-4 border-t border-[#0F0F0F]/6">
                  <p className="text-[9px] text-[#0F0F0F]/35 text-center">
                    Use code <span className="text-[#D4AF37] font-bold">PEARLIS10</span> for 10% off at checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
