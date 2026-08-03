import React, { useContext, useMemo, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const Cart = () => {
  const {
    API_URL,
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    setCartItems,
    getTotalCartAmount,
    user,
    setShowLogin,
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const toast = useToast();

  // Promo state — validated by the server, so any code in promos.js works.
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState(''); // the validated code, or ''
  const [discountRate, setDiscountRate] = useState(0); // e.g. 0.15
  const [checking, setChecking] = useState(false);
  const [promoError, setPromoError] = useState('');

  // One row per menu item still in the cart, with its line total resolved.
  const lines = useMemo(
    () =>
      food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({
          ...item,
          qty: cartItems[item._id],
          lineTotal: item.price * cartItems[item._id],
        })),
    [food_list, cartItems]
  );

  const units = lines.reduce((n, l) => n + l.qty, 0);

  // Calculation Logic — the server recomputes all of this at checkout; these
  // figures are a preview only.
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const discountAmount = appliedCode ? subtotal * discountRate : 0;
  const finalTotal = subtotal - discountAmount + deliveryFee;
  const discountPct = Math.round(discountRate * 100);

  const removeLine = (id) => {
    setCartItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

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

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    const code = promoCode.trim();
    if (!code) return;
    setChecking(true);
    setPromoError('');
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
        setPromoCode('');
        toast.success(`${code.toUpperCase()} applied — ${Math.round(json.rate * 100)}% off`);
      } else {
        setAppliedCode('');
        setDiscountRate(0);
        setPromoError('That code isn’t valid.');
      }
    } catch {
      setPromoError('Could not check the code. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const clearPromo = () => {
    setAppliedCode('');
    setDiscountRate(0);
    setPromoError('');
  };

  if (lines.length === 0) {
    return (
      <main className='cart'>
        <section className='cart-blank'>
          <img src={assets.basket_icon} alt='' className='cart-blank-mark' />
          <h1>Your cart is empty</h1>
          <p>Pick something from the menu and it will show up here, ready to check out.</p>
          <button type='button' className='cart-cta' onClick={() => navigate('/')}>
            Browse the menu
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className='cart'>
      <header className='cart-head'>
        <h1>Your cart</h1>
        <p className='cart-count'>
          {units} {units === 1 ? 'item' : 'items'} · {lines.length}{' '}
          {lines.length === 1 ? 'dish' : 'dishes'}
        </p>
      </header>

      <div className='cart-grid'>
        <section className='cart-lines' aria-label='Items in your cart'>
          <ul>
            {lines.map((line, i) => (
              <li key={line._id} className='cart-line' style={{ '--i': i }}>
                <img className='cart-line-img' src={line.image} alt={line.name} loading='lazy' />

                <div className='cart-line-body'>
                  <h2>{line.name}</h2>
                  <p className='cart-line-unit'>{money(line.price)} each</p>
                </div>

                <div className='cart-step' role='group' aria-label={`Quantity of ${line.name}`}>
                  <button
                    type='button'
                    onClick={() => removeFromCart(line._id)}
                    aria-label={`One fewer ${line.name}`}
                  >
                    −
                  </button>
                  <span className='cart-step-n'>{line.qty}</span>
                  <button
                    type='button'
                    onClick={() => addToCart(line._id)}
                    aria-label={`One more ${line.name}`}
                  >
                    +
                  </button>
                </div>

                <p className='cart-line-total'>{money(line.lineTotal)}</p>

                <button
                  type='button'
                  className='cart-line-x'
                  onClick={() => removeLine(line._id)}
                  aria-label={`Remove ${line.name} from your cart`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <button type='button' className='cart-more' onClick={() => navigate('/')}>
            <span aria-hidden='true'>←</span> Keep browsing the menu
          </button>
        </section>

        <aside className='cart-summary' aria-label='Order summary'>
          <h2>Order summary</h2>

          <dl className='cart-sums'>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {appliedCode && (
              <div className='is-credit'>
                <dt>
                  {appliedCode} · {discountPct}% off
                </dt>
                <dd>−{money(discountAmount)}</dd>
              </div>
            )}
            <div>
              <dt>Delivery</dt>
              <dd>{money(deliveryFee)}</dd>
            </div>
          </dl>

          <div className='cart-tear' aria-hidden='true' />

          <p className='cart-grand'>
            <span>Total</span>
            <span className='cart-grand-n'>{money(finalTotal)}</span>
          </p>

          <button type='button' className='cart-checkout' onClick={handleCheckout}>
            Continue to checkout
          </button>
          <p className='cart-note'>Delivery address and payment come next.</p>

          <div className='cart-promo'>
            {appliedCode ? (
              <p className='cart-coupon'>
                <span className='cart-coupon-tag'>{appliedCode}</span>
                <span className='cart-coupon-text'>{discountPct}% off applied</span>
                <button type='button' className='cart-coupon-x' onClick={clearPromo}>
                  Remove
                </button>
              </p>
            ) : (
              <form onSubmit={handlePromoSubmit} noValidate>
                <label htmlFor='cart-promo-input'>Promo code</label>
                <div className='cart-promo-row'>
                  <input
                    id='cart-promo-input'
                    type='text'
                    autoComplete='off'
                    placeholder='e.g. WELCOME10'
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError('');
                    }}
                    aria-invalid={promoError ? 'true' : undefined}
                    aria-describedby={promoError ? 'cart-promo-error' : undefined}
                  />
                  <button type='submit' disabled={checking || !promoCode.trim()}>
                    {checking ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className='cart-promo-error' id='cart-promo-error' role='alert'>
                    {promoError}
                  </p>
                )}
              </form>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
