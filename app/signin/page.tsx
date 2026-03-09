"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  
  const redirect = searchParams.get("redirect") || "/";
  const message = searchParams.get("message");

  useEffect(() => {
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result?.error) {
        setError(result.error.message || "Invalid email or password");
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] py-20">
      <Container className="max-w-md">
        <div className="bg-white rounded p-8 shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-8 text-black">Sign In</h1>
          
          {infoMessage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              {infoMessage}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-12 px-4 rounded border-gray-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 px-4 rounded border-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#00676E] hover:bg-[#00575e] text-white font-bold text-lg rounded"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} 
              className="text-[#00676E] font-semibold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
