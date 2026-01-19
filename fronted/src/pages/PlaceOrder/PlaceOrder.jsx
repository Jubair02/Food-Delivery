import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useLocation, useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const { getTotalCartAmount } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve discount from the previous page (Cart), default to 0 if accessed directly
  const discountAmount = location.state?.discountAmount || 0;

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  // Optional: Redirect if cart is empty
  useEffect(() => {
    if (subtotal === 0) {
      navigate('/cart');
    }
  }, [subtotal, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Order Placed Successfully!");
    // Add logic here to clear cart or send data to backend
  };

  return (
    <form className='place-order' onSubmit={handleSubmit}>
      
      {/* LEFT SIDE: Delivery Details */}
      <div className="place-order-left">
        <p className='title'>Delivery Information</p>
        
        <div className="multi-fields">
          <input required type="text" placeholder='First name' />
          <input required type="text" placeholder='Last name' />
        </div>
        
        <input required type="email" placeholder='Email address' />
        <input required type="text" placeholder='Street' />
        
        <div className="multi-fields">
          <input required type="text" placeholder='City' />
          <input required type="text" placeholder='State' />
        </div>
        
        <div className="multi-fields">
          <input required type="text" placeholder='Zip code' />
          <input required type="text" placeholder='Country' />
        </div>
        
        <input required type="text" placeholder='Phone' />
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
            
            {/* Only show discount row if a discount exists */}
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
          
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
}

export default PlaceOrder;