
"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { useAuthenticationSettings } from "@/components/auth/auth-image-provider";

type SignInStep = "identifier" | "password";

type BrowserClerk = {
  loaded?: boolean;
  setActive?: (params: { session: string }) => Promise<void>;
  client?: {
    signIn?: {
      create: (params: { identifier: string; password: string }) => Promise<{
        status: string;
        createdSessionId?: string;
      }>;
      authenticateWithRedirect?: (params: {
        strategy: "oauth_google";
        redirectUrl: string;
        redirectUrlComplete: string;
      }) => Promise<void>;
      authenticateWithRedirectOrPopup?: (params: {
        strategy: "oauth_google";
        redirectUrl: string;
        redirectUrlComplete: string;
      }) => Promise<void>;
    };
  };
};

type BrowserSignInResource = NonNullable<NonNullable<BrowserClerk["client"]>["signIn"]>;

function getBrowserClerk(): BrowserClerk | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { Clerk?: BrowserClerk }).Clerk ?? null);
}

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  return value;
}

function getClerkErrorMessage(error: unknown) {
  const firstError =
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors)
      ? (error as { errors: Array<{ longMessage?: string; message?: string }> })
          .errors[0]
      : null;

  if (firstError?.longMessage) return firstError.longMessage;
  if (firstError?.message) return firstError.message;
  if (error instanceof Error) return error.message;

  return "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const authenticationSettings = useAuthenticationSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const [step, setStep] = useState<SignInStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTo = useMemo(
    () => getSafeRedirect(searchParams.get("redirect")),
    [searchParams]
  );
  const checkoutMessage = searchParams.get("message");
  const isGoogleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
  const browserClerk = getBrowserClerk();
  const signInResource =
    browserClerk?.client?.signIn &&
    typeof browserClerk.client.signIn.create === "function"
      ? browserClerk.client.signIn
      : signIn && typeof (signIn as { create?: unknown }).create === "function"
        ? (signIn as unknown as BrowserSignInResource)
        : null;
  const isAuthReady = Boolean(browserClerk?.loaded && signInResource);

  useEffect(() => {
    if (isAuthReady) {
      setErrorMessage((previous) =>
        previous === "Sign-in is still loading. Please try again." ? "" : previous
      );
    }
  }, [isAuthReady]);

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setErrorMessage("");
    setStep("password");
  };

  const handleEmailPasswordSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signInResource || !isAuthReady) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await signInResource.create({
        identifier,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        } else if (browserClerk?.setActive) {
          await browserClerk.setActive({ session: result.createdSessionId });
        }
        router.replace(redirectTo);
        return;
      }

      setErrorMessage("Your sign-in needs an additional step. Please try again.");
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInResource || !isAuthReady) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const oauthSignIn =
        signInResource.authenticateWithRedirect ??
        signInResource.authenticateWithRedirectOrPopup;

      if (!oauthSignIn) {
        setErrorMessage("Google sign-in is not available right now. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      await oauthSignIn({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo,
      });
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image with Gradient Overlay */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src={authenticationSettings?.signInImagePath || "/about/food-img.png"}
          alt={authenticationSettings?.signInImageAltText || "Delicious food presentation"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/30 to-black/55" />
        
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-white">
          <h2 className="mb-4 whitespace-pre-line text-center font-['Bebas_Neue'] text-6xl uppercase leading-tight tracking-wide">
            {authenticationSettings?.signInImageHeading || "Waste Less.\nTaste More."}
          </h2>
          <p className="max-w-md text-center text-lg opacity-90">
            {authenticationSettings?.signInImageDescription ||
              "Join our community for exclusive recipes, chef tips, and sustainable cooking inspiration."}
          </p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-gray-50 to-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="mb-2 font-['Bebas_Neue'] text-5xl uppercase tracking-wide text-black">
              {step === "identifier"
                ? authenticationSettings?.signInFormHeading || "Welcome Back"
                : "Enter Password"}
            </h1>
            <p className="text-gray-600">
              {step === "identifier"
                ? authenticationSettings?.signInFormDescription ||
                  "Sign in to continue your culinary journey"
                : `Signing in as ${identifier}`}
            </p>
          </div>

          {checkoutMessage && (
            <div className="mb-4 rounded-lg border border-[#98d0d4] bg-[#edf8f9] px-4 py-3 text-sm text-[#0b4f54]">
              {checkoutMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isAuthReady && (
            <div className="mb-4 rounded-lg border border-[#98d0d4] bg-[#edf8f9] px-4 py-3 text-sm text-[#0b4f54]">
              Initializing secure sign-in...
            </div>
          )}

          {step === "identifier" && (
            <>
              {isGoogleEnabled && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting || !isAuthReady}
                    className="mb-6 flex h-14 w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 transition-all hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-base font-semibold">Continue with Google</span>
                  </button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-gradient-to-br from-gray-50 to-white px-4 text-gray-500">Or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleContinue} className="space-y-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Email Address
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="h-14 w-full rounded-lg border-2 border-gray-200 px-4 transition-colors focus:border-[#00676E] focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-lg bg-[#00676E] text-lg font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00575e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Continue
                </button>
              </form>
            </>
          )}

          {step === "password" && (
            <form onSubmit={handleEmailPasswordSignIn} className="space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-14 w-full rounded-lg border-2 border-gray-200 px-4 transition-colors focus:border-[#00676E] focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !isAuthReady}
                className="h-14 w-full rounded-lg bg-[#00676E] text-lg font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00575e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setStep("identifier");
                }}
                className="w-full text-sm font-semibold uppercase tracking-wide text-[#00676E] transition-colors hover:text-[#00575e]"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-bold text-[#00676E] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
