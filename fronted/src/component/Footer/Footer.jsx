import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
const Footer = () => {
    return (
        <div className='footer' id='footer'>
            <div className="footer-content">
                <div className="footer-content-left">
                    <img src={assets.logo} alt="" />
                    <p> Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sunt sapiente enim distinctio earum, nemo facilis, libero eligendi adipisci possimus tempore nesciunt quae mollitia quidem. Similique nam quo perferendis optio facere.</p>
                    <div className="footer-social-icons">
                        <img src={assets.facebook_icon} alt="" />
                        <img src={assets.twitter_icon} alt="" />
                        <img src={assets.linkedin_icon} alt="" />
                    </div>
                </div>

                <div className='footer-content-center'>
                    <h2>Company</h2>
                    <ul>
                        <li>Home</li>
                        <li>About Us</li>
                        <li>Delivery</li>
                        <li>Privacy policy</li>

                    </ul>
                </div>

                <div className="footer-content-right">
                <h2>GET IN TOUCH</h2>
                <ul>
                    <li>01756-456822</li>
                    <li>contact@khaidai.com</li>
                </ul>
                </div>

                
            </div>
            <hr />
            <p className="footer-copyright">
                &copy; 2024 Khaidai.com - All rights reserved.
            </p>

        </div>
    )
}

export default Footer
