import { sdk } from '@/lib/config';
import { getCartId } from '@/lib/data/cookies';
import { retrieveCustomer } from '@/lib/data/customer';

import DummyPaymentClient from './DummyPaymentClient';
import { getDinarPaymentPreview } from './lib';

export default async function DummyPaymentPage() {
  const cartId = await getCartId();

  if (!cartId) {
    return <div>404</div>;
  }
  const res = await getDinarPaymentPreview(cartId);

  return (
    <DummyPaymentClient
      cart_id={cartId}
      preview={res}
    />
  );
}
