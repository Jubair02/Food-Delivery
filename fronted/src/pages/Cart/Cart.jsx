import React, { useContext, useState } from 'react';
import './cart.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount } = useContext(StoreContext);
  const navigate = useNavigate();

  // State for promo code logic
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState({ applied: false, message: '' });

  // Calculation Logic
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const discountAmount = promoStatus.applied ? subtotal * 0.15 : 0;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  const handlePromoSubmit = () => {
    if (promoCode.trim().toUpperCase() === 'JUBAIR15') {
      setPromoStatus({ applied: true, message: 'Coupon "jubair15" Applied Successfully!' });
    } else {
      setPromoStatus({ applied: false, message: 'Invalid Promo Code. Try Again' });
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
                  <p onClick={() => removeFromCart(item._id)} className='cross'>x</p>
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
            {promoStatus.applied && (
              <>
                <div className="cart-total-details discount">
                  <p>Discount (15%)</p>
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
            
          <button onClick={() => navigate('/order', { state: { discountAmount: discountAmount } })}>
            PROCEED TO CHECKOUT
          </button>

          {/* <button onClick={() => navigate('/order')}>PROCEED TO CHECKOUT</button> */}
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
              <button onClick={handlePromoSubmit}>Submit</button>
            </div>
            {/* Feedback Message */}
            {promoStatus.message && (
              <p className={`promo-message ${promoStatus.applied ? 'success' : 'error'}`}>
                {promoStatus.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;