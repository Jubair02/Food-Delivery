import React from 'react'
import './ExploreMenu.css'
import { menu_list} from '../../assets/assets'
const ExploreMenu = ({category,setCategory}) => {
  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our menu</h1>
      <p className="explore-menu-text">Choose from a diverse menu featuring a delectable array of dishes Our mission is to satisfy your 
        cravings and elevate your dining experience, one delicious meal at a time.</p>
    <div className="explore-menu-list">
        {menu_list.map((item) =>{
            return (
                <button
                    type="button"
                    onClick={()=> setCategory(prev=>prev===item.menu_name?"All":item.menu_name)}
                    key={item.menu_name}
                    className="explore-menu-list-item"
                    aria-pressed={category===item.menu_name}
                >
                    <img className={category===item.menu_name?"active":"" } src={item.menu_image} onError={(e)=>{ if (item.menu_image_local) e.currentTarget.src = item.menu_image_local }} alt="" />
                    <p>{item.menu_name}</p>
                </button>
            )
        }) }

        
    </div>
        <hr />
    </div>
  )
}

export default ExploreMenu
