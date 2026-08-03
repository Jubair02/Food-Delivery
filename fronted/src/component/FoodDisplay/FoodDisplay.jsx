import React, { useContext } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {

  const { food_list, searchQuery } = useContext(StoreContext)

  const query = (searchQuery || '').trim().toLowerCase();
  const filtered = food_list.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesSearch = !query || item.name.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const heading = query
    ? `Results for “${searchQuery}”`
    : category === 'All'
      ? 'Our dishes'
      : category;

  /* The old copy said "No dishes match your search." for every empty result —
     including a category with nothing in it and no search active at all. */
  const emptyMessage = query
    ? category === 'All'
      ? `Nothing matches “${searchQuery}”. Try a different word.`
      : `Nothing in ${category} matches “${searchQuery}”.`
    : `No dishes in ${category} right now.`;

  return (
    <section className='food-display' id='food-display'>
      <div className='food-display-head'>
        <h2>{heading}</h2>
        {filtered.length > 0 && (
          <p className='food-display-count'>
            {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="food-display-empty">{emptyMessage}</p>
      ) : (
        <div className="food-display-list">
          {filtered.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              rating={item.rating}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default FoodDisplay
