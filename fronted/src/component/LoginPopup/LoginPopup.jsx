import React, { useContext, useEffect, useRef, useState } from 'react'
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

// Google's mark, inline so the button needs no network request or icon library.
const GoogleMark = () => (
    <svg viewBox='0 0 18 18' width='17' height='17' aria-hidden='true'>
        <path fill='#4285F4' d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91a8.78 8.78 0 0 0 2.69-6.62z' />
        <path fill='#34A853' d='M9 18a8.6 8.6 0 0 0 5.95-2.18l-2.9-2.26A5.4 5.4 0 0 1 9 14.42a5.4 5.4 0 0 1-5.08-3.74H.96v2.34A9 9 0 0 0 9 18z' />
        <path fill='#FBBC05' d='M3.92 10.68a5.4 5.4 0 0 1 0-3.36V4.98H.96a9 9 0 0 0 0 8.04l2.96-2.34z' />
        <path fill='#EA4335' d='M9 3.58a4.87 4.87 0 0 1 3.44 1.35l2.58-2.59A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.98l2.96 2.34A5.4 5.4 0 0 1 9 3.58z' />
    </svg>
);

const LoginPopup = () => {

    const { setShowLogin } = useContext(StoreContext);
    const toast = useToast();

    const [currState, setCurrState] = useState("Login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const isSignUp = currState === "Sign Up";
    const dialogRef = useRef(null);
    const firstFieldRef = useRef(null);

    const close = () => setShowLogin(false);

    /* The dialog previously had no way out but the × button, left focus on the
       page behind it, and let that page keep scrolling. */
    useEffect(() => {
        const opener = document.activeElement;
        const onKey = (e) => { if (e.key === 'Escape') setShowLogin(false); };
        const prevOverflow = document.body.style.overflow;

        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            if (opener instanceof HTMLElement) opener.focus(); // hand focus back
        };
    }, [setShowLogin]);

    // Focus the first field on open and whenever the mode changes.
    useEffect(() => { firstFieldRef.current?.focus(); }, [currState]);

    // Keep Tab inside the dialog while it is open.
    const onDialogKeyDown = (e) => {
        if (e.key !== 'Tab') return;
        const nodes = dialogRef.current?.querySelectorAll('button, input, a[href]');
        if (!nodes?.length) return;
        const items = Array.from(nodes).filter((el) => !el.disabled && el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const onChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const switchMode = () => {
        setCurrState(isSignUp ? "Login" : "Sign Up");
        setError("");
        setShowPassword(false);
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
        setError("");
        try {
            if (isSignUp) {
                const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
                if (form.name) {
                    await updateProfile(cred.user, { displayName: form.name });
                }
                toast.success("Account created. Welcome.");
            } else {
                await signInWithEmailAndPassword(auth, form.email, form.password);
                toast.success("Signed in successfully.");
            }
            setShowLogin(false);
        } catch (err) {
            // Shown in the form rather than as a toast — the problem is here.
            setError(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success("Signed in successfully.");
            setShowLogin(false);
        } catch (err) {
            setError(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className='login-popup'
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
            <div
                className='login-card'
                ref={dialogRef}
                onKeyDown={onDialogKeyDown}
                role='dialog'
                aria-modal='true'
                aria-labelledby='login-heading'
            >
                {/* Brand panel — the order ticket that runs through the whole app,
                    so the front door speaks the same language as the product. */}
                <aside className='login-brand' aria-hidden='true'>
                    <img src={assets.logo} alt='' className='login-brand-logo' />

                    <p className='login-brand-line'>
                        Good food,<br />followed all the way.
                    </p>

                    <div className='login-tickets'>
                        <div className='login-ticket is-back'>
                            <span className='login-ticket-top'>
                                <b>#4C1D0A</b>
                                <i>Delivered</i>
                            </span>
                            <span className='login-ticket-tear' />
                            <span className='login-ticket-foot'>2 items<em>$28.40</em></span>
                        </div>

                        <div className='login-ticket is-front'>
                            <span className='login-ticket-top'>
                                <b>#7F2A91</b>
                                <i className='is-live'>On the way</i>
                            </span>
                            <span className='login-ticket-rail'>
                                <span />
                            </span>
                            <span className='login-ticket-tear' />
                            <span className='login-ticket-foot'>3 items<em>$47.20</em></span>
                        </div>
                    </div>
                </aside>

                {/* Form panel */}
                <div className='login-panel'>
                    <button type='button' className='login-close' aria-label='Close' onClick={close}>
                        <img src={assets.cross_icon} alt='' />
                    </button>

                    <h2 id='login-heading'>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
                    <p className='login-sub'>
                        {isSignUp
                            ? 'One account to order, save an address, and track deliveries.'
                            : 'Sign in to order and follow your food to the door.'}
                    </p>

                    <button
                        type='button'
                        className='login-google'
                        onClick={handleGoogle}
                        disabled={loading}
                    >
                        <GoogleMark />
                        Continue with Google
                    </button>

                    <p className='login-divider'><span>or use your email</span></p>

                    <form onSubmit={onSubmitHandler} noValidate>
                        {isSignUp && (
                            <div className='login-field'>
                                <label htmlFor='lp-name'>Your name</label>
                                <input
                                    id='lp-name'
                                    ref={firstFieldRef}
                                    name='name'
                                    value={form.name}
                                    onChange={onChange}
                                    type='text'
                                    autoComplete='name'
                                    placeholder='Jubair Hossain'
                                    required
                                />
                            </div>
                        )}

                        <div className='login-field'>
                            <label htmlFor='lp-email'>Email</label>
                            <input
                                id='lp-email'
                                ref={isSignUp ? undefined : firstFieldRef}
                                name='email'
                                value={form.email}
                                onChange={onChange}
                                type='email'
                                autoComplete='email'
                                placeholder='you@example.com'
                                required
                            />
                        </div>

                        <div className='login-field'>
                            <label htmlFor='lp-password'>Password</label>
                            <div className='login-password'>
                                <input
                                    id='lp-password'
                                    name='password'
                                    value={form.password}
                                    onChange={onChange}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                    placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
                                    required
                                />
                                <button
                                    type='button'
                                    className='login-reveal'
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {isSignUp && <p className='login-hint'>Use six characters or more.</p>}
                        </div>

                        {/* Consent belongs to account creation, not to every sign-in —
                            it used to gate both. */}
                        {isSignUp && (
                            <div className='login-consent'>
                                <input
                                    id='lp-terms'
                                    type='checkbox'
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    required
                                />
                                <label htmlFor='lp-terms'>
                                    I agree to the terms of use and privacy policy.
                                </label>
                            </div>
                        )}

                        {error && (
                            <p className='login-error' role='alert'>{error}</p>
                        )}

                        <button
                            type='submit'
                            className='login-submit'
                            disabled={loading || (isSignUp && !agreed)}
                        >
                            {loading
                                ? (isSignUp ? 'Creating your account…' : 'Signing you in…')
                                : (isSignUp ? 'Create account' : 'Sign in')}
                        </button>
                    </form>

                    <p className='login-switch'>
                        {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
                        <button type='button' onClick={switchMode}>
                            {isSignUp ? 'Sign in' : 'Create an account'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPopup
