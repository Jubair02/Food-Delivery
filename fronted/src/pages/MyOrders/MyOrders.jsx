import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const MyOrders = () => {
  const { API_URL, getToken, user, authReady, socket } = useContext(StoreContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    };
    socket.on('order:status', onStatus);
    return () => socket.off('order:status', onStatus);
  }, [socket]);

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>

      {loading && <p className='my-orders-empty'>Loading your orders…</p>}
      {!loading && orders.length === 0 && (
        <p className='my-orders-empty'>You haven’t placed any orders yet.</p>
      )}

      <div className='my-orders-list'>
        {orders.map((order) => (
          <div key={order._id} className='my-orders-item'>
            <img src={assets.parcel_icon} alt='' />
            <p className='my-orders-food'>
              {order.items.map((it, i) => (
                `${it.name} x ${it.quantity}${i < order.items.length - 1 ? ', ' : ''}`
              ))}
            </p>
            <p>${order.amount.toFixed(2)}</p>
            <p>Items: {order.items.length}</p>
            <p className={`my-orders-status status-${order.status.toLowerCase().replace(/ /g, '-')}`}>
              <span>&#x25cf;</span> <b>{order.status}</b>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
