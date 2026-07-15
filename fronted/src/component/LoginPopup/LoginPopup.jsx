import React, { useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { auth, googleProvider } from '../../firebase/config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';

const LoginPopup = () => {

    const { setShowLogin } = useContext(StoreContext);
    const toast = useToast();

    const [currState, setCurrState] = useState("Login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const onChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Turn Firebase's error codes into friendlier messages.
    const friendlyError = (code) => {
        switch (code) {
            case "auth/invalid-credential":
            case "auth/wrong-password":
            case "auth/user-not-found":
                return "Incorrect email or password.";
            case "auth/email-already-in-use":
                return "An account with this email already exists.";
            case "auth/weak-password":
                return "Password should be at least 6 characters.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/popup-closed-by-user":
                return "Sign-in was cancelled.";
            default:
                return "Something went wrong. Please try again.";
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currState === "Sign Up") {
                const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
                if (form.name) {
                    await updateProfile(cred.user, { displayName: form.name });
                }
                toast.success("Account created. Welcome!");
            } else {
                await signInWithEmailAndPassword(auth, form.email, form.password);
                toast.success("Signed in successfully.");
            }
            setShowLogin(false);
        } catch (err) {
            toast.error(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success("Signed in successfully.");
            setShowLogin(false);
        } catch (err) {
            toast.error(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='login-popup'>
            <form className="login-popup-container" onSubmit={onSubmitHandler}>
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <button type="button" className="icon-button" aria-label="Close" onClick={() => setShowLogin(false)}>
                        <img src={assets.cross_icon} alt="" />
                    </button>
                </div>
                <div className="login-popup-inputs">

                    {currState === "Login" ? <></> : (
                        <input name="name" value={form.name} onChange={onChange} type="text" placeholder='your name' aria-label="Your name" required />
                    )}

                    <input name="email" value={form.email} onChange={onChange} type="email" placeholder='your email' aria-label="Your email" required />
                    <input name="password" value={form.password} onChange={onChange} type="password" placeholder='your password' aria-label="Your password" required />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Please wait..." : currState === "Sign Up" ? "Create Account" : "Login"}
                </button>

                <button type="button" className="login-popup-google" onClick={handleGoogle} disabled={loading}>
                    Continue with Google
                </button>

                <div className="login-popup-condition">
                    <input type="checkbox" required />
                    <p>By continuing, I agree to the terms of use & privacy policy</p>
                </div>

                {currState === "Login"
                    ? <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
                    : <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
                }
            </form>
        </div>
    )
}

export default LoginPopup
