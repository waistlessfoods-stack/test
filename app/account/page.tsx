'use client';

import { useState } from 'react';
import { RedirectToSignIn, UserProfile } from '@clerk/nextjs';
import { useSession } from '@/lib/auth-client';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AccountPage() {
  const { data: session, isPending } = useSession();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] py-20">
        <Container className="max-w-3xl">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="animate-pulse">
              <div className="mb-4 h-8 w-1/3 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!session?.user) {
    return <RedirectToSignIn redirectUrl="/account" />;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-[#F4F4F4] py-20">
      <Container className="max-w-3xl">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="mb-8 text-slate-600">Manage your account details in your style</p>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Name</p>
              <p className="mt-1 text-lg text-slate-900">{user.name || 'Not set'}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Email</p>
              <p className="mt-1 text-lg text-slate-900">{user.email || 'Not set'}</p>
              <p className={`mt-2 text-sm font-medium ${user.emailVerified ? 'text-green-700' : 'text-amber-700'}`}>
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Account Created</p>
              <p className="mt-1 text-slate-800">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-[#00676E] text-white hover:bg-[#00575e]"
              >
                Open Clerk Profile Manager
              </Button>
            </div>
          </div>

          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogContent className="clerk-profile-modal max-h-[90vh] w-[96vw] max-w-5xl overflow-y-auto border border-slate-200 bg-white p-4 md:p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-[#1C1C1C]">Profile Manager</DialogTitle>
              </DialogHeader>
              <div className="mt-2 flex justify-center">
                <UserProfile
                  path="/account"
                  routing="path"
                  appearance={{
                    variables: {
                      colorPrimary: '#00676E',
                    },
                    elements: {
                      card: 'shadow-none bg-transparent border-0',
                      cardBox: 'shadow-none bg-transparent',
                    },
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Container>
    </div>
  );
}
