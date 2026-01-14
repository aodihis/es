'use client';

import React, { useEffect, useState } from 'react';

import { HttpTypes } from '@medusajs/types';
import { useElements, useStripe } from '@stripe/react-stripe-js';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { placeOrder } from '@/lib/data/cart';
import { orderErrorFormatter } from '@/lib/helpers/order-error-formatter';
import { toast } from '@/lib/helpers/toast';

import { isDinar, isDoku, isManual, isStripe } from '../../../lib/constants';

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart;
  'data-testid': string;
};

const PaymentButton: React.FC<PaymentButtonProps> = ({ cart, 'data-testid': dataTestId }) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1;

  const paymentSession = cart.payment_collection?.payment_sessions?.[0];

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      );
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          notReady={notReady}
          data-testid={dataTestId}
        />
      );
    case isDoku(paymentSession?.provider_id):
      return (
        <DokuPaymentButton
          cart={cart}
          notReady={notReady}
        />
      );
    case isDinar(paymentSession?.provider_id):
      return <DinarPaymentButton cart={cart} />;
    default:
      return (
        <Button
          disabled
          className="w-full"
        >
          Select a payment method
        </Button>
      );
  }
};

const DokuPaymentButton = ({
  cart,
  notReady
}: {
  cart: HttpTypes.StoreCart;
  notReady: boolean;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder(
        undefined,
        // @ts-ignore
        cart.payment_collection?.payment_sessions[0].data.payment_url
      );
      console.log(res);
      if (!res.ok) {
        setErrorMessage(res.error?.message);
      }
    } catch (error: any) {
      if (error?.message !== 'NEXT_REDIRECT') {
        setErrorMessage(error?.message?.replace('Error setting up the request: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = () => {
    onPaymentCompleted();
  };

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        className="w-full"
        loading={submitting}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  );
};
const DinarPaymentButton = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handlePayment = () => {
    if (disabled) return;

    setDisabled(true);
    setSubmitting(true);
    setShowPayment(true);
  };

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder();
      if (!res.ok) {
        setErrorMessage(res.error?.message);
      }
    } catch (error: any) {
      if (error?.message !== 'NEXT_REDIRECT') {
        setErrorMessage(error?.message?.replace('Error setting up the request: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== 'DINAR_PAYMENT_RESULT') return;

      const { status, message } = event.data;

      setShowPayment(false);
      setSubmitting(false);
      setDisabled(false);

      if (status === 'success') {
        await onPaymentCompleted();
        return;
      }

      if (status === 'error') {
        setErrorMessage(message || 'Dinar payment failed');
        return;
      }

      // status === "closed"
      // user manually closed the iframe → do nothing
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClose = () => {
    setShowPayment(false);
    setSubmitting(false);
    setDisabled(false);
  };

  return (
    <>
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative h-[600px] w-[420px] rounded-xl bg-white shadow-lg">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <iframe
              src={`/payment-dummy?cart_id=${cart.id}`}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}

      <Button
        disabled={disabled}
        loading={submitting}
        onClick={handlePayment}
        className="w-full"
      >
        Pay with Dinar
      </Button>
      <ErrorMessage error={errorMessage} />
    </>
  );
};

const StripePaymentButton = ({
  cart,
  notReady,
  'data-testid': dataTestId
}: {
  cart: HttpTypes.StoreCart;
  notReady: boolean;
  'data-testid'?: string;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(true);

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder();
      if (!res.ok) {
        setErrorMessage(res.error?.message);
      }
    } catch (error: any) {
      if (error?.message !== 'NEXT_REDIRECT') {
        setErrorMessage(error?.message?.replace('Error setting up the request: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stripe = useStripe();
  const elements = useElements();
  const card = elements?.getElement('card');

  const session = cart.payment_collection?.payment_sessions?.find(s => s.status === 'pending');

  useEffect(() => {
    //@ts-ignore
    setDisabled(!card?._complete);
  }, [card, stripe, elements, cart]);

  const handlePayment = async () => {
    setSubmitting(true);

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false);
      return;
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name: cart.billing_address?.first_name + ' ' + cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined
          }
        }
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent;

          if ((pi && pi.status === 'requires_capture') || (pi && pi.status === 'succeeded')) {
            onPaymentCompleted();
          }

          setErrorMessage(error.message || null);
          return;
        }

        if (
          (paymentIntent && paymentIntent.status === 'requires_capture') ||
          paymentIntent.status === 'succeeded'
        ) {
          return onPaymentCompleted();
        }

        return;
      });
  };

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        loading={submitting}
        className="w-full"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  );
};

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder();
      if (!res.ok) {
        setErrorMessage(res.error?.message);
      }
    } catch (error: any) {
      if (error?.message !== 'NEXT_REDIRECT') {
        setErrorMessage(error?.message?.replace('Error setting up the request: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = () => {
    onPaymentCompleted();
  };

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        className="w-full"
        loading={submitting}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  );
};

export default PaymentButton;
