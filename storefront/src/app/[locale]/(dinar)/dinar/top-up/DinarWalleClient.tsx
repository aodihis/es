// app/(store)/dinar-wallet/dinar-wallet-client.tsx
'use client';

import { useState } from 'react';

import { getAuthHeaders } from '@/lib/data/cookies';

import { sdk } from '../../../../../lib/config';
import { doTopUp } from './lib';

export default function DinarWalletClient({ initialBalance }: { initialBalance: number | null }) {
  const [balance, setBalance] = useState<number | null>(initialBalance);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const topUp = async () => {
    if (!amount) return;

    setLoading(true);

    try {
      const res = await doTopUp(amount);

      setBalance(res.balance);
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Dinar Wallet</h1>

      <div>
        <span className="font-medium">Balance:</span> {balance === null ? 'Unavailable' : balance}
      </div>

      <input
        type="number"
        placeholder="Top up amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-full rounded border px-3 py-2"
      />

      <button
        onClick={topUp}
        disabled={loading}
        className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Top Up'}
      </button>
    </div>
  );
}
