import './FoodItem.css'
import { assets } from '../../assets/assets'
import React, { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'

/**
 * Real rating, set per item in the admin panel. Two stacked rows of glyphs with
 * the filled row clipped to a percentage, so 4.3 shows as four and a bit stars
 * rather than being rounded away. Renders nothing when the item is unrated.
 */
const Stars = ({ value }) => {
    const pct = Math.max(0, Math.min(100, (value / 5) * 100))
    return (
        <span className='food-item-stars' title={`${value.toFixed(1)} out of 5`}>
            {/* Fill nested inside the track so both rows share identical font
                metrics and the percentage clip lines up on the glyph. */}
            <span className='food-item-stars-track' aria-hidden='true'>
                ★★★★★
                <span className='food-item-stars-fill' style={{ width: `${pct}%` }}>★★★★★</span>
            </span>
            <span className='food-item-stars-value'>{value.toFixed(1)}</span>
        </span>
    )
}

const FoodItem = ({ id, name, price, description, image, rating }) => {

    const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
    const qty = cartItems[id] || 0
    const rated = typeof rating === 'number' && rating > 0

    return (
        <article className='food-item'>
            <div className="food-item-img-container">
                <img className="food-item-image" src={image} alt={name} loading='lazy' />

                {qty === 0
                    ? <button type="button" className="food-item-add" aria-label={`Add ${name} to cart`} onClick={() => addToCart(id)}>
                        <img src={assets.add_icon_white} alt="" />
                    </button>
                    : <div className="food-item-counter">
                        <button type="button" className="icon-button" aria-label={`One fewer ${name}`} onClick={() => removeFromCart(id)}>
                            <img src={assets.remove_icon_red} alt="" />
                        </button>
                        <p aria-label={`${qty} in cart`}>{qty}</p>
                        <button type="button" className="icon-button" aria-label={`One more ${name}`} onClick={() => addToCart(id)}>
                            <img src={assets.add_icon_green} alt="" />
                        </button>
                    </div>
                }
            </div>

            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <h3>{name}</h3>
                    {/* No stars at all when nobody has rated it — the card used to
                        show the same hardcoded 4 stars on every single dish. */}
                    {rated && <Stars value={rating} />}
                </div>
                <p className="food-item-desc">{description}</p>
                <p className="food-item-price">${Number(price || 0).toFixed(2)}</p>
            </div>
        </article>
    )
}

export default FoodItem
