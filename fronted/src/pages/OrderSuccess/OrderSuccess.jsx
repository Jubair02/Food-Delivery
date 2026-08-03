import React from 'react';
import './OrderSuccess.css';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

/* The real status flow an order moves through, so this page sets expectations
   that the tracker on My Orders will actually confirm. */
const NEXT_STEPS = [
  { title: 'The kitchen accepts it', body: 'Usually within a few minutes of ordering.' },
  { title: 'Your food gets cooked', body: 'The status updates live while you wait.' },
  { title: 'A rider brings it over', body: 'Follow it the whole way from your orders.' },
];

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // No history state means the page was opened directly or refreshed — there is
  // no order to confirm, so send them to where the real record lives instead of
  // showing a confirmation we can't stand behind.
  if (!location.state) return <Navigate to='/myorders' replace />;

  const paid = location.state.paid === true;

  return (
    <main className='order-success'>
      <section className='os-card'>
        <span className='os-check' aria-hidden='true'>
          <svg viewBox='0 0 52 52' width='38' height='38'>
            <circle className='os-check-ring' cx='26' cy='26' r='23' />
            <path className='os-check-tick' d='M15 27 L23 35 L38 18' />
          </svg>
        </span>

        <h1>Your order is in</h1>

        <p className='os-lede'>
          {paid
            ? 'Payment received. The kitchen has your order and will start on it shortly.'
            : 'The kitchen has your order. Have the cash ready for the rider when it arrives.'}
        </p>

        <p className='os-tag'>{paid ? 'Paid online' : 'Cash on delivery'}</p>

        <div className='os-tear' aria-hidden='true' />

        <h2>What happens next</h2>
        <ol className='os-next'>
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title}>
              <span className='os-next-n' aria-hidden='true'>
                {i + 1}
              </span>
              <span className='os-next-text'>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className='os-actions'>
          <button type='button' className='os-primary' onClick={() => navigate('/myorders')}>
            Track your order
          </button>
          <button type='button' className='os-link' onClick={() => navigate('/')}>
            Back to the menu
          </button>
        </div>
      </section>
    </main>
  );
};

export default OrderSuccess;
