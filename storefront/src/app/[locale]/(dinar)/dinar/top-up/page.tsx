// app/(store)/dinar-wallet/page.tsx
import { getAuthHeaders } from '@/lib/data/cookies';

import { sdk } from '../../../../../lib/config';
import DinarWalletClient from './DinarWalleClient';
import { getBalance } from './lib';
import { Footer, Header } from '@/components/organisms';

export default async function DinarWalletPage() {
  let balance: number | null = null;

  try {
    const res = await getBalance();
    balance = res.balance;
  } catch {
    balance = null;
  }

  return (
    <>
      <Header/>
         <DinarWalletClient initialBalance={balance} />
      <Footer />
    </>
  )
}
