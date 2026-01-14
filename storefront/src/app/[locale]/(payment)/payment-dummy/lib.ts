'use server';

import { getAuthHeaders } from '../../../../lib/data/cookies';

export type DinarPreview = {
  amount_idr: number;
  dinar_cost: number;
  balance: number;
  sufficient: boolean;
  rate: string;
};

export async function getDinarPaymentPreview(cart_id: string) {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/dinar-payment/preview`, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      cart_id: cart_id
    }),
    credentials: 'include'
  }).then(res => {
    return res;
  });

  return response.json();
}

export async function makePayment(cart_id: string, pin: string) {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const response = await fetch(
    `${process.env.MEDUSA_BACKEND_URL}/store/dinar-payment/make-payment`,
    {
      headers,
      method: 'POST',
      body: JSON.stringify({
        cart_id,
        pin
      }),
      credentials: 'include'
    }
  ).then(res => {
    return res;
  });

  return response.status == 200;
}
