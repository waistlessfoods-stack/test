import Link from 'next/link';

export default function StripeTestContent({ mode, classesEnabled }: { mode: 'live' | 'test' | 'unconfigured'; classesEnabled: boolean }) {
  return <main className="min-h-screen bg-[#F8F6F2] px-6 py-16 text-[#1C1C1C]">
    <div className="mx-auto w-full max-w-xl rounded-xl border border-[#E3DDD3] bg-white p-8">
      <h1 className="text-3xl font-semibold">Checkout verification</h1>
      <p className="mt-4 leading-7">Use a published shop item and your customer account to check the complete cart, checkout, confirmation, and order-history flow.</p>
      <p className="mt-4 rounded-lg bg-teal-50 p-4 text-sm">Current payment environment: <strong>{mode}</strong>. {mode === 'live' ? 'Checkout uses real payments. Coordinate an explicitly approved transaction with Amber before paying.' : mode === 'test' ? 'Use Stripe test payment details for sandbox checks.' : 'Configure the payment environment before testing.'}</p>
      <p className="mt-4 text-sm">Public class enrollment is {classesEnabled ? 'enabled' : 'disabled'}. Class verification uses a prepared class after its date, capacity, and release are approved.</p>
      <div className="mt-6 flex flex-wrap gap-4"><Link href="/shop" className="rounded-lg bg-[#086b70] px-5 py-3 font-medium text-white">Open Shop</Link><Link href="/orders" className="rounded-lg border border-[#086b70] px-5 py-3 font-medium text-[#086b70]">My Orders</Link></div>
    </div>
  </main>;
}
