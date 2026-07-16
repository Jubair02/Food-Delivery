import React, { useContext, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { API_URL, cartItems, food_list, removeFromCart, getTotalCartAmount, user, setShowLogin } = useContext(StoreContext);
  const navigate = useNavigate();
  const toast = useToast();

  // Promo state — validated by the server, so any code in promos.js works.
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');   // the validated code, or ''
  const [discountRate, setDiscountRate] = useState(0);   // e.g. 0.15
  const [checking, setChecking] = useState(false);

  // Calculation Logic
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const discountAmount = appliedCode ? subtotal * discountRate : 0;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      setShowLogin(true);
      toast.info('Please sign in to check out.');
      return;
    }
    navigate('/order', {
      state: { promoCode: appliedCode, discountAmount },
    });
  };

  const handlePromoSubmit = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/order/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.valid) {
        setAppliedCode(code.toUpperCase());
        setDiscountRate(json.rate);
        toast.success(`Coupon "${code.toUpperCase()}" applied — ${Math.round(json.rate * 100)}% off!`);
      } else {
        setAppliedCode('');
        setDiscountRate(0);
        toast.error('Invalid promo code. Try again.');
      }
    } catch {
      toast.error('Could not check the promo code. Try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt={item.name} />
                  <p>{item.name}</p>
                  <p>${item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>${(item.price * cartItems[item._id]).toFixed(2)}</p>
                  <button type="button" onClick={() => removeFromCart(item._id)} className='cross' aria-label={`Remove ${item.name}`}>x</button>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <hr />

            {/* Conditionally Render Discount Row */}
            {appliedCode && (
              <>
                <div className="cart-total-details discount">
                  <p>Discount ({Math.round(discountRate * 100)}%)</p>
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
            
          <button onClick={handleCheckout}>
            PROCEED TO CHECKOUT
          </button>
        </div>

        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className="cart-promocode-input">
              <input
                type="text"
                placeholder='promo code'
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button onClick={handlePromoSubmit} disabled={checking}>{checking ? '…' : 'Submit'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;