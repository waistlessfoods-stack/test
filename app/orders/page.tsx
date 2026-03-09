"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { CheckCircle, XCircle, Clock, Package, CreditCard } from "lucide-react";
import Link from "next/link";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagePath?: string;
};

type Order = {
  id: number;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  status: string;
  amount: number;
  currency: string;
  items: OrderItem[];
  customerEmail: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showSuccess = searchParams.get("success") === "1";

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin?redirect=/orders");
      return;
    }

    if (session) {
      fetchOrders();
    }
  }, [session, isPending, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isPending || loading) {
    return (
      <div className="w-full min-h-screen bg-white font-metropolis">
        <Container className="py-20">
          <div className="text-center">
            <p className="text-xl text-gray-600">Loading your orders...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-white font-metropolis">
      <Container className="py-20">
        {showSuccess && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Payment Successful!
                </h3>
                <p className="text-green-700">
                  Your order has been placed successfully. You'll receive a confirmation email shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">Order History</h1>
          <p className="text-gray-600">
            View your past purchases and their details
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start shopping to see your order history here
            </p>
            <Link href="/shop">
              <Button className="bg-[#0F8DAB] hover:bg-[#0d7a94]">
                Browse Recipes
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Order Summary */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-black">
                            Order #{order.id}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-black">
                          {formatCurrency(order.amount, order.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item: OrderItem, index: number) => (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          {item.imagePath && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={item.imagePath}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-black">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × $
                              {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="font-semibold text-black">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Details */}
                    {order.stripePaymentIntentId && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="w-4 h-4" />
                          <span>
                            Payment ID:{" "}
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg">
                              {order.stripePaymentIntentId}
                            </code>
                          </span>
                        </div>
                        {order.metadata?.paymentStatus && (
                          <p className="text-sm text-gray-600 mt-2">
                            Payment Status:{" "}
                            <span className="font-medium">
                              {order.metadata.paymentStatus}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
