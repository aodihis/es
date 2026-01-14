'use server';

import { getAuthHeaders } from '@/lib/data/cookies';

export async function doTopUp(amount: string) {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/dinar-wallets/top-up`, {
    headers,
    method: 'POST',
    body: JSON.stringify({ amount: Number(amount) }),
    credentials: 'include'
  }).then(res => {
    return res;
  });

  return response.json();
}

export async function getBalance() {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/dinar-wallets/balance`, {
    headers,
    method: 'GET',
    credentials: 'include'
  }).then(res => {
    return res;
  });

  return response.json();
}
