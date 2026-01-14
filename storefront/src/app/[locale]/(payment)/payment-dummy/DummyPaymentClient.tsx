'use client';

import { useEffect, useState } from 'react';

import { sdk } from '@/lib/config';

import { makePayment } from './lib';

type PreviewResponse = {
  amount_idr: number;
  dinar_cost: number;
  balance: number;
  sufficient: boolean;
  rate: string;
};

export default function DummyPaymentClient({
  cart_id,
  preview
}: {
  cart_id: string;
  preview: PreviewResponse;
}) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!pin) return;

    setSubmitting(true);

    try {
      const res = await makePayment(cart_id, pin);
      if (!res) {
        throw new Error('Failed to make payment');
      }
      window.parent.postMessage({ type: 'DINAR_PAYMENT_RESULT', status: 'success' }, '*');
    } catch {
      window.parent.postMessage(
        {
          type: 'DINAR_PAYMENT_RESULT',
          status: 'error',
          message: 'Payment failed'
        },
        '*'
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      window.parent.postMessage({ type: 'DINAR_PAYMENT_RESULT', status: 'closed' }, '*');
    };
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold">Confirm Dinar Payment</h1>

      <div className="space-y-1 text-sm">
        <p>Amount (IDR): {preview.amount_idr}</p>
        <p>Dinar Cost: {preview.dinar_cost}</p>
        <p>Your Balance: {preview.balance}</p>
        <p className="text-gray-500">{preview.rate}</p>
      </div>

      {!preview.sufficient && <p className="text-sm text-red-600">Insufficient balance</p>}

      <input
        type="password"
        placeholder="Enter PIN"
        value={pin}
        onChange={e => setPin(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      <button
        disabled={!preview.sufficient || submitting}
        onClick={handleConfirm}
        className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
      >
        {submitting ? 'Processing…' : 'Confirm Payment'}
      </button>
    </div>
  );
}
