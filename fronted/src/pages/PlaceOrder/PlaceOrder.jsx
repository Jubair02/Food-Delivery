import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

/* Field definitions live in data so the markup stays one loop per group and the
   label, autofill hint and validator can't drift apart. `half` means the field
   shares a row on desktop. */
const RECIPIENT_FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name', half: true },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name', half: true },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
];

const ADDRESS_FIELDS = [
  { name: 'street', label: 'Street address', autoComplete: 'street-address' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', half: true },
  { name: 'state', label: 'State or region', autoComplete: 'address-level1', half: true },
  { name: 'zipcode', label: 'Zip or postal code', autoComplete: 'postal-code', half: true },
  { name: 'country', label: 'Country', autoComplete: 'country-name', half: true },
];

const ALL_FIELDS = [...RECIPIENT_FIELDS, ...ADDRESS_FIELDS];

const required = (label) => (v) => (String(v || '').trim() ? '' : `Enter a ${label}`);

const VALIDATORS = {
  firstName: required('first name'),
  lastName: required('last name'),
  email: (v) => {
    const value = String(v || '').trim();
    if (!value) return 'Enter an email address';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : 'Enter a valid email address';
  },
  phone: (v) => {
    const value = String(v || '').trim();
    if (!value) return 'Enter a phone number';
    // Deliberately loose — international formats vary too much to pin down.
    return value.replace(/\D/g, '').length >= 7 ? '' : 'Enter a number the rider can call';
  },
  street: required('street address'),
  city: required('city'),
  state: required('state or region'),
  zipcode: required('zip or postal code'),
  country: required('country'),
};

const PAYMENT_OPTIONS = [
  {
    id: 'online',
    label: 'Card',
    hint: 'You finish paying on our secure Stripe page.',
  },
  {
    id: 'cod',
    label: 'Cash on delivery',
    hint: 'Pay the rider when your food arrives.',
  },
];

const STEPS = ['Cart', 'Details', 'Done'];

const PlaceOrder = () => {
  const {
    cartItems,
    food_list,
    getTotalCartAmount,
    placeOrder,
    clearCart,
    user,
    authReady,
    profile,
  } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const placedRef = useRef(false); // set once an order is placed, so the empty-cart guard won't hijack the success redirect

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
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    // Clear as soon as they start fixing it; re-checked on blur and on submit.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    const message = VALIDATORS[name] ? VALIDATORS[name](value) : '';
    setErrors((prev) => ({ ...prev, [name]: message }));
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
  // Skip once an order has just been placed — otherwise clearing the cart
  // (subtotal → 0) would bounce the user to /cart instead of the success page.
  useEffect(() => {
    if (!authReady || placedRef.current) return;
    if (subtotal === 0) {
      navigate('/cart');
    } else if (!user) {
      navigate('/cart');
    }
  }, [subtotal, user, authReady, navigate]);

  // What they're about to pay for, so checkout can show the order, not just a total.
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = {};
    ALL_FIELDS.forEach(({ name }) => {
      const message = VALIDATORS[name](data[name]);
      if (message) found[name] = message;
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Send focus to the first problem rather than leaving them to hunt for it.
      const first = ALL_FIELDS.find((f) => found[f.name]);
      document.getElementById(`po-${first.name}`)?.focus();
      return;
    }

    setSubmitting(true);
    const result = await placeOrder({ address: data, promoCode, paymentMethod });

    // Online payment: hand off to Stripe Checkout.
    if (result.session_url) {
      placedRef.current = true;
      window.location.replace(result.session_url);
      return;
    }

    setSubmitting(false);

    // Cash on delivery (chosen by the customer, or Stripe not configured).
    if (result.success) {
      placedRef.current = true;
      clearCart();
      navigate('/order-success', { state: { paid: false } });
    } else {
      toast.error(result.message || 'Failed to place order.');
    }
  };

  const renderField = ({ name, label, type = 'text', autoComplete, half }) => {
    const error = errors[name];
    return (
      <div key={name} className={`po-field${half ? '' : ' is-wide'}${error ? ' has-error' : ''}`}>
        <label htmlFor={`po-${name}`}>{label}</label>
        <input
          id={`po-${name}`}
          name={name}
          type={type}
          value={data[name]}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `po-${name}-error` : undefined}
        />
        {error && (
          <p className='po-field-error' id={`po-${name}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const activeOption = PAYMENT_OPTIONS.find((o) => o.id === paymentMethod);

  return (
    <main className='place-order'>
      <header className='po-head'>
        <Link to='/cart' className='po-back'>
          <span aria-hidden='true'>←</span> Back to cart
        </Link>
        <h1>Checkout</h1>

        {/* Same rail motif as the delivery tracker on My Orders — checkout is a
            genuine three-step sequence, so position carries real meaning. */}
        <p className='po-sr'>Step 2 of 3: delivery details</p>
        <ol className='po-steps' aria-hidden='true'>
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={`po-step${i < 1 ? ' is-done' : ''}${i === 1 ? ' is-now' : ''}`}
            >
              <span className='po-step-dot' />
              {step}
            </li>
          ))}
        </ol>
      </header>

      <form className='po-grid' onSubmit={handleSubmit} noValidate>
        <div className='po-form'>
          <fieldset className='po-group'>
            <legend>Who is this for?</legend>
            <div className='po-fields'>{RECIPIENT_FIELDS.map(renderField)}</div>
          </fieldset>

          <fieldset className='po-group'>
            <legend>Where should we bring it?</legend>
            <div className='po-fields'>{ADDRESS_FIELDS.map(renderField)}</div>
          </fieldset>
        </div>

        <aside className='po-receipt' aria-label='Order summary'>
          <h2>
            Your order
            <span className='po-receipt-count'>
              {units} {units === 1 ? 'item' : 'items'}
            </span>
          </h2>

          <ul className='po-lines'>
            {lines.map((line) => (
              <li key={line._id}>
                <span className='po-qty'>{line.qty}×</span>
                <span className='po-line-name'>{line.name}</span>
                <span className='po-line-price'>{money(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className='po-sums'>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className='is-credit'>
                <dt>{promoCode ? `${promoCode} discount` : 'Discount'}</dt>
                <dd>−{money(discountAmount)}</dd>
              </div>
            )}
            <div>
              <dt>Delivery</dt>
              <dd>{money(deliveryFee)}</dd>
            </div>
          </dl>

          <div className='po-tear' aria-hidden='true' />

          <p className='po-grand'>
            <span>Total</span>
            <span className='po-grand-n'>{money(finalTotal)}</span>
          </p>

          <fieldset className='po-pay'>
            <legend>How would you like to pay?</legend>
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`po-pay-option${paymentMethod === option.id ? ' is-on' : ''}`}
              >
                <input
                  type='radio'
                  name='paymentMethod'
                  value={option.id}
                  checked={paymentMethod === option.id}
                  onChange={() => setPaymentMethod(option.id)}
                />
                <span className='po-pay-mark' aria-hidden='true' />
                <span className='po-pay-label'>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <button type='submit' className='po-submit' disabled={submitting}>
            {submitting
              ? 'Placing order…'
              : paymentMethod === 'cod'
                ? `Place order · ${money(finalTotal)}`
                : `Continue to payment · ${money(finalTotal)}`}
          </button>

          <p className='po-note'>{activeOption?.hint}</p>
        </aside>
      </form>
    </main>
  );
};

export default PlaceOrder;
