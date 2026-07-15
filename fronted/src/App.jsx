import React, { useContext } from 'react'
import Navbar from './component/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import MyOrders from './pages/MyOrders/MyOrders'
import Profile from './pages/Profile/Profile'
import Verify from './pages/Verify/Verify'
import OrderSuccess from './pages/OrderSuccess/OrderSuccess'
import Footer from './component/Footer/Footer'
import LoginPopup from './component/LoginPopup/LoginPopup'
import { StoreContext } from './context/StoreContext'

const App = () => {

  const { showLogin } = useContext(StoreContext);

  return (
    <>
      {showLogin ? <LoginPopup /> : <></>}
      <Navbar />
      <div className='app'>

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/myorders' element={<MyOrders />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/order-success' element={<OrderSuccess />} />
          <Route path='*' element={<Home />} />
        </Routes>

      </div>
      <Footer />

    </>

  )
}

export default App
