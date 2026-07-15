
import './FoodItem.css'
import { assets } from '../../assets/assets'
import React ,{ useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'

const FoodItem = ({id,name,price,description,image}) => {

    
    const {cartItems,addToCart,removeFromCart} = useContext(StoreContext);

    return (
    <div className='food-item'>
        <div className="food-item-img-container">
            <img  className="food-item-image" src={image} alt={name} />
            {
                !cartItems[id]
                ?<button type="button" className="add icon-button" aria-label={`Add ${name} to cart`} onClick={()=> addToCart(id)}>
                    <img src={assets.add_icon_white} alt="" />
                 </button>
                : <div className="food-item-counter">

                    <button type="button" className="icon-button" aria-label={`Remove one ${name}`} onClick={()=>removeFromCart(id)}>
                        <img src={assets.remove_icon_red} alt="" />
                    </button>
                    <p>{cartItems[id]}</p>
                    <button type="button" className="icon-button" aria-label={`Add one ${name}`} onClick={()=> addToCart(id)}>
                        <img src={assets.add_icon_green} alt="" />
                    </button>

                </div>
            }
        </div>

        <div className="food-item-info">
            <div className="food-item-name-rating">
                <p>{name}</p>
                <img src={assets.rating_starts} alt="Rated 4 out of 5 stars" />
            </div>
            <p className="food-item-desc">{description}</p>
            <p className="food-item-price">${price}</p>

        </div>
      
    </div>
  )
}

export default FoodItem
