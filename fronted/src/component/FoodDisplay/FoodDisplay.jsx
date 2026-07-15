import React, { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
const FoodDisplay = ({category}) => {

    const {food_list, searchQuery} = useContext(StoreContext)

    const query = (searchQuery || '').trim().toLowerCase();
    const filtered = food_list.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

  return (
    <div className='food-display' id ='food-display'>
      <h2>{query ? `Results for "${searchQuery}"` : 'Top dishes near you'}</h2>
      {filtered.length === 0
        ? <p className="food-display-empty">No dishes match your search.</p>
        : <div className="food-display-list">
            {filtered.map((item) => (
              <FoodItem key={item._id} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image}/>
            ))}
          </div>
      }
    </div>
  )
}

export default FoodDisplay
