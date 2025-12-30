import React, { useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets';
const LoginPopup = ({ setShowLogin }) => {

    const [currStete, setCurrState] = useState("Login");

    return (
        <div className='login-popup'>
            <form className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currStete}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
                </div>
                <div className="login-popup-inputs">

                    {currStete === "Login" ? <></> : <input type="text" placeholder='your name' required />}

                    <input type="email" placeholder='your email' required />
                    <input type="password" placeholder='your password' required />
                </div>
                <button>{currStete === "Sign Up" ? "Create Account" : "Login"}
                </button>
                <div className="login-popup-condition">
                    <input type="checkbox" required />
                    <p>By continuing, i agree to the terms of use & privacy policy</p>

                </div>
                {currStete === "Login" ?
                    <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
                    :<p>Already have a account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
                }





            </form>
        </div>
    )
}

export default LoginPopup
