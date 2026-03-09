'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function AccountPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Redirect to signin if not authenticated
  if (!isPending && !session) {
    router.push('/signin?redirect=/account');
    return null;
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] py-20">
        <Container className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const user = session?.user;

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    setVerificationMessage('');
    setVerificationError('');

    try {
      const response = await fetch('/api/account/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationError(data.error || 'Failed to send verification email');
        return;
      }

      setVerificationMessage(
        'Verification email sent! Please check your inbox (and spam folder).'
      );
    } catch (error) {
      setVerificationError('Failed to request verification email');
    } finally {
      setRequestingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] py-20">
      <Container className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-600 mb-8">Manage your account information</p>

          {/* Account Information */}
          <div className="space-y-6">
            {/* Name */}
            <div className="border-b border-slate-200 pb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <p className="text-lg text-slate-900">{user?.name || 'Not set'}</p>
            </div>

            {/* Email */}
            <div className="border-b border-slate-200 pb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <p className="text-lg text-slate-900 mb-4">{user?.email}</p>

              {/* Email Verification Status */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    user?.emailVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user?.emailVerified ? 'bg-green-600' : 'bg-yellow-600'
                    }`}
                  ></span>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </div>
              </div>

              {/* Verify Email Section */}
              {!user?.emailVerified && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-4">
                    Your email address hasn't been verified yet. A verification link will be
                    sent to your email address.
                  </p>

                  {verificationMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
                      {verificationMessage}
                    </div>
                  )}

                  {verificationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                      {verificationError}
                    </div>
                  )}

                  <Button
                    onClick={handleRequestVerification}
                    disabled={requestingVerification}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {requestingVerification ? 'Sending...' : 'Send Verification Email'}
                  </Button>
                </div>
              )}

              {user?.emailVerified && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Your email address has been verified. Thank you!
                  </p>
                </div>
              )}
            </div>

            {/* Account Created */}
            <div className="pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Created
              </label>
              <p className="text-slate-600">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <Button
              onClick={async () => {
                await signOut();
                router.push('/');
                router.refresh();
              }}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
