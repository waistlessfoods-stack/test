"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Menu, ShoppingCart, ChevronDown, X, User, LogOut, Package, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-context";
import EnquiryDialog from "@/components/enquiry-dialog";
import { useSession } from "@/lib/auth-client";
import { getIconPath } from "@/lib/social-links";
import type { SocialLink } from "@/lib/contentful-links";
import type { HeaderSettings } from "@/lib/contentful-management";

const services = [
  { label: "Private Service", href: "/services/private" },
  { label: "Catering", href: "/services/catering" },
  { label: "Cooking Class", href: "/services/cooking-class" },
];

export default function Header({ 
  socialLinks = [],
  headerSettings
}: { 
  socialLinks?: SocialLink[];
  headerSettings?: HeaderSettings | null;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isVerificationSending, setIsVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isEnquiryDialogOpen, setIsEnquiryDialogOpen] = useState(false);
  const pathname = usePathname();
  const { items, totalItems, totalPrice, removeItem, updateQuantity } =
    useCart();
  const { data: session, isPending } = useSession();

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const formattedTotal = currencyFormatter.format(totalPrice);

  const handleCheckout = async () => {
    // Check if user is signed in
    if (!session?.user) {
      // Redirect to sign in page with return URL
      router.push("/signin?redirect=/shop&message=Please sign in to complete your purchase");
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const payload = await response.json();
        
        // If auth error, redirect to sign in
        if (response.status === 401) {
          router.push("/signin?redirect=/shop&message=" + encodeURIComponent(payload.error || "Please sign in to checkout"));
          return;
        }
        
        throw new Error(payload?.error || "Checkout failed.");
      }

      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("No checkout URL returned.");
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Checkout failed. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!session?.user?.email || session.user.emailVerified) {
      return;
    }

    setIsVerificationSending(true);
    setVerificationMessage("");
    setVerificationError("");

    try {
      setVerificationMessage(
        "Please complete email verification in your Clerk account flow."
      );
    } catch {
      setVerificationError("Unable to load verification guidance.");
    } finally {
      setIsVerificationSending(false);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "Recipes", href: "/recipes" },
    { label: "Gallery", href: "/gallery" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="w-full bg-white relative z-50">
      {/* Banner */}
      {headerSettings?.promotionBannerEnabled && headerSettings.promotionBannerText && (
        <div 
          className="w-full h-[45px] flex items-center justify-center"
          style={{
            backgroundColor: headerSettings.promotionBannerBackgroundColor || "#00676E",
          }}
        >
          {headerSettings.promotionBannerLink ? (
            <Link 
              href={headerSettings.promotionBannerLink}
              className="text-uppercase text-[16px] font-semibold hover:opacity-80 transition-opacity"
              style={{
                color: headerSettings.promotionBannerTextColor || "#FFFFFF",
              }}
            >
              {headerSettings.promotionBannerText}
            </Link>
          ) : (
            <span 
              className="text-uppercase text-[16px] font-semibold"
              style={{
                color: headerSettings.promotionBannerTextColor || "#FFFFFF",
              }}
            >
              {headerSettings.promotionBannerText}
            </span>
          )}
        </div>
      )}

      {/* DESKTOP VIEW */}
      <div className="hidden xl:flex items-center py-5 w-full">
        <Container className="flex items-center">
          <div className="flex-1 flex justify-start">
          <Link href="/" className="relative w-28 h-28">
            <Image
              src="/logo.png"
              alt="Logo"
              width={119}
              height={119}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            />
          </Link>
        </div>

        <nav className="flex justify-center pt-6">
          <ul className="flex items-center gap-10">
            {navLinks.slice(0, 2).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${
                    isLinkActive(link.href)
                      ? "border-b border-[#09686E] text-[#09686E]"
                      : "text-[#464646]"
                  } font-semibold uppercase hover:text-[#09686E] transition-colors`}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li
              className="relative group"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <Link
                href="/services"
                className={`flex items-center gap-1 font-semibold uppercase transition-colors ${
                  isLinkActive("/services")
                    ? "text-[#09686E]"
                    : "text-[#464646] group-hover:text-[#09686E]"
                }`}
              >
                Chef Services
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {isOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-60 z-60">
                  <ul className="bg-white border border-slate-100 rounded-md shadow-xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {services.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="block w-full px-5 py-3 text-sm font-medium text-[#464646] hover:bg-[#00676E] hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            {navLinks.slice(2).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${
                    isLinkActive(link.href)
                      ? "border-b border-[#09686E] text-[#09686E]"
                      : "text-[#464646]"
                  } font-semibold uppercase hover:text-[#09686E] transition-colors`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 flex flex-col items-end gap-6">
          <div className="flex items-center gap-6">
            <Button
              size="sm"
              className="bg-[#00676E] hover:bg-[#00575e] text-white whitespace-nowrap"
              onClick={() => setIsEnquiryDialogOpen(true)}
            >
              Complimentary Consultation
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-[#19767C] shrink-0" />
              <div className="flex items-center gap-2">
                {socialLinks.slice(0, 2).map((social) => (
                  <a
                    key={social.title}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.title}
                    className="transition-all hover:opacity-70 hover:scale-110"
                  >
                    <Image
                      alt={social.title}
                      width={24}
                      height={24}
                      src={getIconPath(social.icon)}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isPending && (
              session?.user ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-[#F9F8F8] font-bold"
                    >
                      <User className="w-5 h-5" />
                      {session.user.name || session.user.email}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-6">
                    <div className="flex flex-col gap-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#1C1C1C]">Account</h2>
                        <p className="mt-2 text-sm text-[#6B6B6B]">
                          {session.user.email}
                        </p>
                        <div className="mt-3 rounded-lg border border-[#D4E4E2] bg-[#F8FCFB] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#4D5A59]">
                            Email Status
                          </p>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              session.user.emailVerified ? "text-green-700" : "text-amber-700"
                            }`}
                          >
                            {session.user.emailVerified ? "Verified" : "Not verified"}
                          </p>
                          {!session.user.emailVerified ? (
                            <>
                              <Button
                                onClick={handleRequestVerification}
                                disabled={isVerificationSending}
                                variant="outline"
                                className="mt-3 w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                              >
                                <BadgeCheck className="w-4 h-4" />
                                {isVerificationSending ? "Sending..." : "Verify Email"}
                              </Button>
                              {verificationMessage ? (
                                <p className="mt-2 text-xs text-green-700">{verificationMessage}</p>
                              ) : null}
                              {verificationError ? (
                                <p className="mt-2 text-xs text-red-600">{verificationError}</p>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                      <Link href="/account">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                        >
                          <User className="w-4 h-4" />
                          Account Settings
                        </Button>
                      </Link>
                      <Link href="/orders">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </Button>
                      </Link>
                      <Button
                        onClick={async () => {
                          await signOut();
                          router.refresh();
                        }}
                        variant="outline"
                        className="gap-2 border-[#D4E4E2] text-[#09686E]"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Link href="/signin">
                  <Button
                    variant="outline"
                    className="gap-2 bg-[#F9F8F8] font-bold"
                  >
                    <User className="w-5 h-5" />
                    SIGN IN
                  </Button>
                </Link>
              )
            )}
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 bg-[#F9F8F8] font-bold"
                >
                  CART
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00676E] px-1 text-[11px] font-semibold text-white">
                        {totalItems}
                      </span>
                    )}
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-6">
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1C1C1C]">
                      Your Cart
                    </h2>
                    <p className="mt-2 text-sm text-[#6B6B6B]">
                      {totalItems === 0
                        ? "Your cart is empty. Add an item to get started."
                        : `${totalItems} item${
                            totalItems === 1 ? "" : "s"
                          } in your cart.`}
                    </p>
                  </div>
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#D4E4E2] bg-[#F8FCFB] p-5 text-sm text-[#6B6B6B]">
                      When you add products, they will appear here with totals
                      and checkout.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-[#EEF2F1] pb-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 overflow-hidden rounded-md bg-[#F4F4F4]">
                              {item.imagePath ? (
                                <Image
                                  src={item.imagePath}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1C1C]">
                                {item.name}
                              </p>
                              <p className="text-xs text-[#6B6B6B]">
                                {currencyFormatter.format(item.price)} each
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="h-7 w-7 rounded-full border border-[#D4E4E2] text-sm text-[#09686E]"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </button>
                            <span className="min-w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              className="h-7 w-7 rounded-full border border-[#D4E4E2] text-sm text-[#09686E]"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                            <button
                              className="text-xs font-semibold text-[#B84B3A]"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm font-semibold text-[#1C1C1C]">
                        <span>Total</span>
                        <span>{formattedTotal}</span>
                      </div>
                      <Button 
                        className="bg-[#00676E] hover:bg-[#00575e]"
                        onClick={handleCheckout}
                        disabled={isCheckoutLoading}
                      >
                        {isCheckoutLoading ? "Processing..." : "Checkout"}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="border-[#D4E4E2] text-[#09686E]"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        </Container>
      </div>

      {/* MOBILE VIEW */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <Container className="xl:hidden flex items-center justify-between py-3 border-b bg-white relative z-100">
          <Link href="/" className="relative w-16 h-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {!isPending && (
              session?.user ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="relative">
                      <User className="w-6 h-6 text-[#00676E]" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-6">
                    <div className="flex flex-col gap-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#1C1C1C]">Account</h2>
                        <p className="mt-2 text-sm text-[#6B6B6B]">
                          {session.user.email}
                        </p>
                        <div className="mt-3 rounded-lg border border-[#D4E4E2] bg-[#F8FCFB] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#4D5A59]">
                            Email Status
                          </p>
                          <p
                            className={`mt-1 text-sm font-medium ${
                              session.user.emailVerified ? "text-green-700" : "text-amber-700"
                            }`}
                          >
                            {session.user.emailVerified ? "Verified" : "Not verified"}
                          </p>
                          {!session.user.emailVerified ? (
                            <>
                              <Button
                                onClick={handleRequestVerification}
                                disabled={isVerificationSending}
                                variant="outline"
                                className="mt-3 w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                              >
                                <BadgeCheck className="w-4 h-4" />
                                {isVerificationSending ? "Sending..." : "Verify Email"}
                              </Button>
                              {verificationMessage ? (
                                <p className="mt-2 text-xs text-green-700">{verificationMessage}</p>
                              ) : null}
                              {verificationError ? (
                                <p className="mt-2 text-xs text-red-600">{verificationError}</p>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                      <Link href="/account">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                        >
                          <User className="w-4 h-4" />
                          Account Settings
                        </Button>
                      </Link>
                      <Link href="/orders">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-[#D4E4E2] text-[#09686E]"
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </Button>
                      </Link>
                      <Button
                        onClick={async () => {
                          await signOut();
                          router.refresh();
                        }}
                        variant="outline"
                        className="gap-2 border-[#D4E4E2] text-[#09686E]"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Link href="/signin">
                  <button className="relative">
                    <User className="w-6 h-6 text-[#00676E]" />
                  </button>
                </Link>
              )
            )}
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button className="relative">
                  <ShoppingCart className="w-6 h-6 text-[#00676E]" />
                  {totalItems > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00676E] px-1 text-[11px] font-semibold text-white">
                      {totalItems}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="p-6">
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1C1C1C]">
                      Your Cart
                    </h2>
                    <p className="mt-2 text-sm text-[#6B6B6B]">
                      {totalItems === 0
                        ? "Your cart is empty. Add an item to get started."
                        : `${totalItems} item${
                            totalItems === 1 ? "" : "s"
                          } in your cart.`}
                    </p>
                  </div>
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#D4E4E2] bg-[#F8FCFB] p-5 text-sm text-[#6B6B6B]">
                      When you add products, they will appear here with totals
                      and checkout.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-[#EEF2F1] pb-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-14 overflow-hidden rounded-md bg-[#F4F4F4]">
                              {item.imagePath ? (
                                <Image
                                  src={item.imagePath}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1C1C]">
                                {item.name}
                              </p>
                              <p className="text-xs text-[#6B6B6B]">
                                {currencyFormatter.format(item.price)} each
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="h-7 w-7 rounded-full border border-[#D4E4E2] text-sm text-[#09686E]"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              -
                            </button>
                            <span className="min-w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              className="h-7 w-7 rounded-full border border-[#D4E4E2] text-sm text-[#09686E]"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              +
                            </button>
                            <button
                              className="text-xs font-semibold text-[#B84B3A]"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm font-semibold text-[#1C1C1C]">
                        <span>Total</span>
                        <span>{formattedTotal}</span>
                      </div>
                      <Button 
                        className="bg-[#00676E] hover:bg-[#00575e]"
                        onClick={handleCheckout}
                        disabled={isCheckoutLoading}
                      >
                        {isCheckoutLoading ? "Processing..." : "Checkout"}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="border-[#D4E4E2] text-[#09686E]"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <SheetTrigger asChild>
              <button>
                {isMobileMenuOpen ? (
                  <X className="w-8 h-8 text-[#00676E]" />
                ) : (
                  <Menu className="w-8 h-8 text-[#00676E]" />
                )}
              </button>
            </SheetTrigger>
          </div>
        </Container>

        <SheetContent side="right" className="p-0">
          <nav className="flex h-full flex-col gap-6 overflow-y-auto p-6 py-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isLinkActive(link.href) ? "text-[#09686E]" : "text-[#464646]"
                } text-xl font-bold uppercase border-b pb-2`}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col gap-4">
              <Link
                href={"/services"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span
                  className={`text-xl font-bold uppercase ${
                    isLinkActive("/services")
                      ? "text-[#09686E]"
                      : "text-[#00676E]"
                  }`}
                >
                  Chef Services
                </span>
              </Link>
              <div className="pl-4 flex flex-col gap-4 border-l-2 border-[#00676E]">
                {services.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-[#464646]"
                  >
                    {service.label}
                  </Link>
                ))}
              </div>
            </div>

            <Button 
              className="bg-[#00676E] w-full mt-4 py-6 text-lg uppercase"
              onClick={() => {
                setIsEnquiryDialogOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              Consultation
            </Button>

            <div className="flex justify-center gap-8 mt-auto pb-10">
              {socialLinks.slice(0, 3).map((social) => (
                <a
                  key={social.title}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.title}
                  className="transition-all hover:opacity-70 hover:scale-110"
                >
                  <Image
                    alt={social.title}
                    width={32}
                    height={32}
                    src={getIconPath(social.icon)}
                  />
                </a>
              ))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <EnquiryDialog
        isOpen={isEnquiryDialogOpen}
        onOpenChange={setIsEnquiryDialogOpen}
        enquiryType="private_chef"
        title="Book a Complimentary Consultation"
        description="Let's discuss how Chef Amber can create a personalized culinary experience for you. Fill out the form below and we'll get back to you soon."
      />
    </header>
  );
}
