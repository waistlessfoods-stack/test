
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSignIn } from "@clerk/nextjs";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";

export default function SignInPage() {
  const isGoogleEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
  const { signIn, fetchStatus } = useSignIn();

  const handleGoogleSignIn = async () => {
    if (fetchStatus === "fetching") return;

    await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/",
      redirectCallbackUrl: "/sso-callback",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image with Gradient Overlay */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/about/food-img.png"
          alt="Delicious Food"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00676E]/90 via-[#00676E]/70 to-[#00676E]/90" />
        
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-white">
          <h2 className="mb-4 text-center font-['Bebas_Neue'] text-6xl uppercase leading-tight tracking-wide">
            Waste Less.<br />Taste More.
          </h2>
          <p className="max-w-md text-center text-lg opacity-90">
            Join our community for exclusive recipes, chef tips, and sustainable cooking inspiration.
          </p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-gray-50 to-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <SignIn.Root>
            <SignIn.Step name="start">
              <div className="mb-8">
                <h1 className="mb-2 font-['Bebas_Neue'] text-5xl uppercase tracking-wide text-[#00676E]">
                  Welcome Back
                </h1>
                <p className="text-gray-600">Sign in to continue your culinary journey</p>
              </div>

              {isGoogleEnabled && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={fetchStatus === "fetching"}
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

              <Clerk.Field name="identifier" className="mb-6 block">
                <Clerk.Label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Email Address
                </Clerk.Label>
                <Clerk.Input className="h-14 w-full rounded-lg border-2 border-gray-200 px-4 transition-colors focus:border-[#00676E] focus:outline-none" />
                <Clerk.FieldError className="mt-2 block text-sm text-red-600" />
              </Clerk.Field>

              <SignIn.Action
                submit
                className="h-14 w-full rounded-lg bg-[#00676E] text-lg font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00575e] hover:shadow-lg"
              >
                Continue
              </SignIn.Action>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-bold text-[#00676E] hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </SignIn.Step>

            <SignIn.Step name="verifications">
              <SignIn.Strategy name="password">
                <div className="mb-8">
                  <h1 className="mb-2 font-['Bebas_Neue'] text-5xl uppercase tracking-wide text-[#00676E]">
                    Enter Password
                  </h1>
                  <p className="text-gray-600">Welcome back! Please enter your password</p>
                </div>

                <Clerk.Field name="password" className="mb-6 block">
                  <Clerk.Label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Password
                  </Clerk.Label>
                  <Clerk.Input
                    type="password"
                    className="h-14 w-full rounded-lg border-2 border-gray-200 px-4 transition-colors focus:border-[#00676E] focus:outline-none"
                  />
                  <Clerk.FieldError className="mt-2 block text-sm text-red-600" />
                </Clerk.Field>

                <SignIn.Action
                  submit
                  className="h-14 w-full rounded-lg bg-[#00676E] text-lg font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00575e] hover:shadow-lg"
                >
                  Sign In
                </SignIn.Action>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-bold text-[#00676E] hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </SignIn.Strategy>

              <SignIn.Strategy name="email_code">
                <div className="mb-8">
                  <h1 className="mb-2 font-['Bebas_Neue'] text-5xl uppercase tracking-wide text-[#00676E]">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600">
                    We sent a verification code to <span className="font-semibold"><SignIn.SafeIdentifier /></span>
                  </p>
                </div>

                <Clerk.Field name="code" className="mb-6 block">
                  <Clerk.Label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Verification Code
                  </Clerk.Label>
                  <Clerk.Input className="h-14 w-full rounded-lg border-2 border-gray-200 px-4 text-center text-2xl tracking-widest transition-colors focus:border-[#00676E] focus:outline-none" />
                  <Clerk.FieldError className="mt-2 block text-sm text-red-600" />
                </Clerk.Field>

                <SignIn.Action
                  submit
                  className="h-14 w-full rounded-lg bg-[#00676E] text-lg font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00575e] hover:shadow-lg"
                >
                  Verify & Sign In
                </SignIn.Action>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-bold text-[#00676E] hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </SignIn.Strategy>
            </SignIn.Step>
          </SignIn.Root>
        </div>
      </div>
    </div>
  );
}
