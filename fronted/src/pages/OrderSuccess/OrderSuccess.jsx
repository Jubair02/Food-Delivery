import React from 'react';
import './OrderSuccess.css';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paid = location.state?.paid; // true = Stripe, false/undefined = COD

  return (
    <div className='order-success'>
      <div className='order-success-check'>&#10003;</div>
      <h2>Order placed successfully!</h2>
      <p>
        Thank you for your order. {paid
          ? 'Your payment was received and your food is being prepared.'
          : 'Please keep the exact amount ready for cash on delivery.'}
      </p>
      <div className='order-success-actions'>
        <button type='button' className='primary' onClick={() => navigate('/myorders')}>
          View My Orders
        </button>
        <button type='button' className='ghost' onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
