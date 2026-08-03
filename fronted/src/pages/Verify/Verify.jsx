import React, { useContext, useEffect, useRef, useState } from 'react';
import './Verify.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Verify = () => {
  const { API_URL, getToken, clearCart, authReady, user } = useContext(StoreContext);
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');
  const ran = useRef(false); // guard against React 18 double-invoke in dev

  // A payment handoff normally resolves in a second or two. If it hasn't, say so
  // rather than leaving an indefinite spinner to imply something is broken.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (ran.current) return;
    ran.current = true;

    const verify = async () => {
      if (!user || !orderId) {
        navigate('/');
        return;
      }
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/order/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId, success }),
        });
        const json = await res.json();
        if (json.success) {
          clearCart();
          navigate('/order-success', { state: { paid: true } });
        } else {
          toast.info('Payment cancelled. Your cart is still saved.');
          navigate('/cart');
        }
      } catch {
        toast.error('Could not confirm payment. Please try again.');
        navigate('/cart');
      }
    };

    verify();
  }, [authReady, user, orderId, success, API_URL, getToken, clearCart, navigate, toast]);

  return (
    <main className='verify'>
      <section className='vf-card' role='status' aria-live='polite'>
        <h1>Confirming your payment</h1>

        <div className='vf-track' aria-hidden='true'>
          <span className='vf-track-run' />
        </div>

        <p className='vf-note'>
          Hold on a moment. Please don’t close this window or use the back button.
        </p>

        {slow && (
          <p className='vf-slow'>
            Still working. A slow connection can make this take longer than usual.
          </p>
        )}
      </section>
    </main>
  );
};

export default Verify;
