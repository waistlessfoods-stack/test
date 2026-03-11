"use client";

import { useUser } from "@clerk/nextjs";

type CompatUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  createdAt: string;
};

type CompatSession = {
  user: CompatUser;
};

export function useSession(): {
  data: CompatSession | null;
  isPending: boolean;
} {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return {
      data: null,
      isPending: true,
    };
  }

  if (!user) {
    return {
      data: null,
      isPending: false,
    };
  }

  return {
    data: {
      user: {
        id: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        emailVerified:
          user.primaryEmailAddress?.verification?.status === "verified",
        createdAt: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : new Date().toISOString(),
      },
    },
    isPending: false,
  };
}
