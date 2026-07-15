import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useLocation, useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const { getTotalCartAmount, placeOrder, clearCart, user, authReady, profile } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Passed from Cart. The discount amount is for display only — the server
  // recomputes it from the promo code so it can't be tampered with.
  const promoCode = location.state?.promoCode || '';
  const discountAmount = location.state?.discountAmount || 0;

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  const [data, setData] = useState({
    firstName: '', lastName: '', email: '', street: '',
    city: '', state: '', zipcode: '', country: '', phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const [syncedSource, setSyncedSource] = useState(undefined);

  const onChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Pre-fill the form from the saved profile (and the account email) whenever
  // that source changes. Render-time sync keeps already-typed values intact.
  const prefillSource = profile ?? user ?? null;
  if (prefillSource !== syncedSource) {
    setSyncedSource(prefillSource);
    const addr = profile?.address;
    setData((prev) => ({
      firstName: prev.firstName || addr?.firstName || '',
      lastName: prev.lastName || addr?.lastName || '',
      email: prev.email || addr?.email || user?.email || '',
      street: prev.street || addr?.street || '',
      city: prev.city || addr?.city || '',
      state: prev.state || addr?.state || '',
      zipcode: prev.zipcode || addr?.zipcode || '',
      country: prev.country || addr?.country || '',
      phone: prev.phone || addr?.phone || '',
    }));
  }

  // Redirect if the cart is empty, or if the user isn't signed in.
  useEffect(() => {
    if (!authReady) return;
    if (subtotal === 0) {
      navigate('/cart');
    } else if (!user) {
      navigate('/cart');
    }
  }, [subtotal, user, authReady, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await placeOrder({ address: data, promoCode, paymentMethod });

    // Online payment: hand off to Stripe Checkout.
    if (result.session_url) {
      window.location.replace(result.session_url);
      return;
    }

    setSubmitting(false);

    // Cash on delivery (chosen by the customer, or Stripe not configured).
    if (result.success) {
      clearCart();
      navigate('/order-success', { state: { paid: false } });
    } else {
      toast.error(result.message || 'Failed to place order.');
    }
  };

  return (
    <form className='place-order' onSubmit={handleSubmit}>

      {/* LEFT SIDE: Delivery Details */}
      <div className="place-order-left">
        <p className='title'>Delivery Information</p>

        <div className="multi-fields">
          <input required name='firstName' value={data.firstName} onChange={onChange} type="text" placeholder='First name' aria-label='First name' />
          <input required name='lastName' value={data.lastName} onChange={onChange} type="text" placeholder='Last name' aria-label='Last name' />
        </div>

        <input required name='email' value={data.email} onChange={onChange} type="email" placeholder='Email address' aria-label='Email address' />
        <input required name='street' value={data.street} onChange={onChange} type="text" placeholder='Street' aria-label='Street' />

        <div className="multi-fields">
          <input required name='city' value={data.city} onChange={onChange} type="text" placeholder='City' aria-label='City' />
          <input required name='state' value={data.state} onChange={onChange} type="text" placeholder='State' aria-label='State' />
        </div>

        <div className="multi-fields">
          <input required name='zipcode' value={data.zipcode} onChange={onChange} type="text" placeholder='Zip code' aria-label='Zip code' />
          <input required name='country' value={data.country} onChange={onChange} type="text" placeholder='Country' aria-label='Country' />
        </div>

        <input required name='phone' value={data.phone} onChange={onChange} type="tel" placeholder='Phone' aria-label='Phone' />
      </div>

      {/* RIGHT SIDE: Cart Totals */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Order Summary</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <hr />

            {discountAmount > 0 && (
              <>
                <div className="cart-total-details discount">
                  <p>Discount Applied</p>
                  <p>-${discountAmount.toFixed(2)}</p>
                </div>
                <hr />
              </>
            )}

            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${deliveryFee.toFixed(2)}</p>
            </div>
            <hr />

            <div className="cart-total-details total">
              <b>Total</b>
              <b>${finalTotal.toFixed(2)}</b>
            </div>
          </div>

          <div className="payment-method">
            <p className="payment-method-title">Payment Method</p>
            <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
              />
              <span>💳 Online Payment (Card)</span>
            </label>
            <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <span>💵 Cash on Delivery</span>
            </label>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting
              ? 'PLACING ORDER...'
              : paymentMethod === 'cod'
                ? 'PLACE ORDER'
                : 'PROCEED TO PAYMENT'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default PlaceOrder;
