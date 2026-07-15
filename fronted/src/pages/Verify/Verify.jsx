import React, { useContext, useEffect, useRef } from 'react';
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
    <div className='verify'>
      <div className='verify-spinner' />
      <p>Confirming your payment…</p>
    </div>
  );
};

export default Verify;
