import React, { useContext, useEffect, useMemo, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

/* The kitchen moves an order through these states in this order. Position on the
   tracker rail is derived from the index here, so it must stay in sync with the
   status enum in backend/models/orderModel.js. */
const FLOW = ['Pending', 'Preparing', 'Out for delivery', 'Delivered'];
const STOPS = ['Placed', 'Cooking', 'On the way', 'Delivered'];

const STATUS_LINE = {
  Pending: 'Waiting for the kitchen',
  Preparing: 'Being cooked now',
  'Out for delivery': 'Out for delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'In progress' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

/* Cancelling is only possible while the order is still Pending. Once the kitchen
   accepts it, say why the option is gone instead of silently dropping it. */
const TOO_LATE = {
  Preparing: 'Too late to cancel — the kitchen has started.',
  'Out for delivery': 'Too late to cancel — your food is on the way.',
};

const isLive = (status) => FLOW.indexOf(status) > -1 && status !== 'Delivered';

const matchesFilter = (order, filter) => {
  if (filter === 'live') return isLive(order.status);
  if (filter === 'delivered') return order.status === 'Delivered';
  if (filter === 'cancelled') return order.status === 'Cancelled';
  return true;
};

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

// Recent orders read better as "Today, 7:42 PM" than as a bare date.
const placedAt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const now = new Date();
  const dayBefore = new Date(now);
  dayBefore.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === dayBefore.toDateString()) return `Yesterday, ${time}`;

  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return `${d.toLocaleDateString('en-US', opts)}, ${time}`;
};

const MyOrders = () => {
  const { API_URL, getToken, user, authReady, socket, food_list } = useContext(StoreContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/order/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setOrders(json.data);
        else toast.error(json.message || 'Failed to load orders.');
      } catch {
        toast.error('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authReady, user, API_URL, getToken, navigate, toast]);

  // Live-update a specific order's status when the admin changes it.
  useEffect(() => {
    if (!socket) return;
    const onStatus = ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      // If the kitchen moves an order on while its cancel prompt is open,
      // retract the prompt — the window has closed.
      if (status !== 'Pending') setConfirmId((id) => (id === orderId ? null : id));
    };
    socket.on('order:status', onStatus);
    return () => socket.off('order:status', onStatus);
  }, [socket]);

  const counts = useMemo(
    () =>
      FILTERS.reduce((acc, f) => {
        acc[f.id] = orders.filter((o) => matchesFilter(o, f.id)).length;
        return acc;
      }, {}),
    [orders]
  );

  const visible = useMemo(() => orders.filter((o) => matchesFilter(o, filter)), [orders, filter]);

  const lifetime = useMemo(
    () => orders.reduce((sum, o) => (o.status === 'Cancelled' ? sum : sum + (o.amount || 0)), 0),
    [orders]
  );

  const imageFor = (foodId) => food_list?.find((f) => f._id === foodId)?.image;

  const cancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/order/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();

      // The server is the authority on status. It returns the order either way,
      // so a page that missed a socket update corrects itself here.
      if (json.data?.status) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: json.data.status } : o))
        );
      }

      if (json.success) toast.success('Order cancelled');
      else toast.error(json.message || 'Could not cancel this order.');
    } catch {
      toast.error('Could not reach the server.');
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  };

  return (
    <main className='my-orders'>
      <header className='mo-head'>
        <div className='mo-head-text'>
          <h1>Orders</h1>
          <p className='mo-sub'>
            {loading
              ? 'Fetching your order history…'
              : orders.length === 0
                ? 'Nothing here yet — your order history will build up as you eat.'
                : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} · ${money(lifetime)} ordered so far`}
          </p>
        </div>

        {counts.live > 0 && (
          <p className='mo-live' title='Status updates arrive automatically'>
            <span className='mo-live-dot' aria-hidden='true' />
            {counts.live} on the way
          </p>
        )}
      </header>

      {!loading && orders.length > 0 && (
        <nav className='mo-filters' aria-label='Filter orders by status'>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type='button'
              className={`mo-filter ${filter === f.id ? 'is-on' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className='mo-filter-count'>{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </nav>
      )}

      {loading && (
        <div className='mo-list' aria-busy='true' aria-live='polite'>
          <span className='mo-sr'>Loading your orders</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className='mo-skeleton' style={{ '--i': i }} aria-hidden='true'>
              <div className='mo-sk-row'>
                <span className='mo-sk-bar w-90' />
                <span className='mo-sk-pill' />
              </div>
              <span className='mo-sk-rail' />
              <div className='mo-sk-stub'>
                <span className='mo-sk-thumb' />
                <span className='mo-sk-thumb' />
                <span className='mo-sk-bar w-120' />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <section className='mo-blank'>
          <img src={assets.parcel_icon} alt='' className='mo-blank-mark' />
          <h2>No orders yet</h2>
          <p>
            Once you place your first order it shows up here, with live tracking from the kitchen to
            your door.
          </p>
          <button type='button' className='mo-cta' onClick={() => navigate('/')}>
            Browse the menu
          </button>
        </section>
      )}

      {!loading && orders.length > 0 && visible.length === 0 && (
        <p className='mo-none'>
          No {FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} orders.{' '}
          <button type='button' className='mo-link' onClick={() => setFilter('all')}>
            Show all orders
          </button>
        </p>
      )}

      <div className='mo-list'>
        {visible.map((order, i) => {
          const cancelled = order.status === 'Cancelled';
          const step = Math.max(0, FLOW.indexOf(order.status));
          const live = isLive(order.status);
          const open = openId === order._id;
          const tone = cancelled ? 'void' : order.status === 'Delivered' ? 'done' : 'live';
          const units = order.items.reduce((n, it) => n + it.quantity, 0);
          const ref = order._id.slice(-6).toUpperCase();
          const addr = order.address || {};

          return (
            <article key={order._id} className={`mo-card tone-${tone}`} style={{ '--i': i }}>
              <div className='mo-card-top'>
                <div className='mo-ident'>
                  <span className='mo-ref'>#{ref}</span>
                  <span className='mo-when'>{placedAt(order.createdAt)}</span>
                </div>
                <p className='mo-status'>
                  <span className='mo-status-dot' aria-hidden='true' />
                  {STATUS_LINE[order.status] || order.status}
                </p>
              </div>

              {cancelled ? (
                <p className='mo-void'>
                  This order was cancelled and won’t be delivered.
                  {order.payment ? ' Get in touch if you need help with a refund.' : ''}
                </p>
              ) : (
                <div className='mo-rail' aria-hidden='true'>
                  <div className='mo-rail-track'>
                    <span
                      className='mo-rail-fill'
                      style={{ width: `${(step / (FLOW.length - 1)) * 100}%` }}
                    />
                  </div>
                  <ol className='mo-stops'>
                    {STOPS.map((label, s) => (
                      <li
                        key={label}
                        className={`mo-stop${s < step ? ' is-done' : ''}${s === step ? ' is-now' : ''}${s === step && live ? ' is-beating' : ''}`}
                      >
                        <span className='mo-stop-dot' />
                        <span className='mo-stop-label'>{label}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className='mo-stub'>
                <div className='mo-stub-summary'>
                  <ul className='mo-thumbs'>
                    {order.items.slice(0, 4).map((it, k) => {
                      const src = imageFor(it.foodId);
                      return (
                        <li key={`${it.foodId}-${k}`} className='mo-thumb' title={it.name}>
                          {src ? (
                            <img src={src} alt={it.name} loading='lazy' />
                          ) : (
                            <span className='mo-thumb-fallback' aria-hidden='true' />
                          )}
                        </li>
                      );
                    })}
                    {order.items.length > 4 && (
                      <li className='mo-thumb mo-thumb-more'>+{order.items.length - 4}</li>
                    )}
                  </ul>

                  <p className='mo-meta'>
                    <span className='mo-amount'>{money(order.amount)}</span>
                    <span className='mo-meta-sep' aria-hidden='true' />
                    {units} {units === 1 ? 'item' : 'items'}
                    <span className='mo-meta-sep' aria-hidden='true' />
                    {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Paid online'}
                  </p>

                  <div className='mo-actions'>
                    {TOO_LATE[order.status] && <p className='mo-locked'>{TOO_LATE[order.status]}</p>}

                    <button
                      type='button'
                      className='mo-toggle'
                      aria-expanded={open}
                      aria-controls={`mo-detail-${order._id}`}
                      onClick={() => setOpenId(open ? null : order._id)}
                    >
                      {open ? 'Hide receipt' : 'View receipt'}
                      <span className='mo-chev' aria-hidden='true' />
                    </button>

                    {/* Cancelling is offered only while the order is Pending. */}
                    {order.status === 'Pending' &&
                      (confirmId === order._id ? (
                        <span
                          className='mo-confirm'
                          role='group'
                          aria-label={`Confirm cancelling order ${ref}`}
                        >
                          <span className='mo-confirm-q'>Cancel this order?</span>
                          <button
                            type='button'
                            className='mo-confirm-yes'
                            disabled={cancellingId === order._id}
                            onClick={() => cancelOrder(order._id)}
                          >
                            {cancellingId === order._id ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                          <button
                            type='button'
                            className='mo-confirm-no'
                            disabled={cancellingId === order._id}
                            onClick={() => setConfirmId(null)}
                          >
                            Keep it
                          </button>
                        </span>
                      ) : (
                        <button
                          type='button'
                          className='mo-cancel'
                          onClick={() => setConfirmId(order._id)}
                        >
                          Cancel order
                        </button>
                      ))}
                  </div>
                </div>

                <div
                  className={`mo-detail-wrap ${open ? 'is-open' : ''}`}
                  id={`mo-detail-${order._id}`}
                  role='region'
                  aria-label={`Receipt for order ${ref}`}
                >
                  <div className='mo-detail'>
                    <ul className='mo-lines'>
                      {order.items.map((it, k) => (
                        <li key={`${it.foodId}-line-${k}`}>
                          <span className='mo-qty'>{it.quantity}×</span>
                          <span className='mo-line-name'>{it.name}</span>
                          <span className='mo-line-price'>{money(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    <dl className='mo-totals'>
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{money(order.subtotal)}</dd>
                      </div>
                      {order.discount > 0 && (
                        <div className='is-credit'>
                          <dt>Discount</dt>
                          <dd>−{money(order.discount)}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Delivery</dt>
                        <dd>{order.deliveryFee > 0 ? money(order.deliveryFee) : 'Free'}</dd>
                      </div>
                      <div className='is-total'>
                        <dt>Total</dt>
                        <dd>{money(order.amount)}</dd>
                      </div>
                    </dl>

                    {(addr.street || addr.city) && (
                      <div className='mo-ship'>
                        <h3>Delivered to</h3>
                        <address>
                          {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}
                          <br />
                          {addr.street}
                          <br />
                          {[addr.city, addr.state, addr.zipcode].filter(Boolean).join(', ')}
                          {addr.country ? `, ${addr.country}` : ''}
                          {addr.phone && (
                            <>
                              <br />
                              {addr.phone}
                            </>
                          )}
                        </address>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
};

export default MyOrders;
