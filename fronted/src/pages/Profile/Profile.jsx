import React, { useContext, useRef, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const EMPTY = {
  firstName: '', lastName: '', street: '',
  city: '', state: '', zipcode: '', country: '', phone: '',
};

const Profile = () => {
  const { API_URL, user, authReady, profile, saveProfile, uploadAvatar } = useContext(StoreContext);
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncedProfile, setSyncedProfile] = useState(null);

  // Only signed-in users have a profile.
  React.useEffect(() => {
    if (authReady && !user) navigate('/');
  }, [authReady, user, navigate]);

  // Populate the form once the profile arrives (render-time sync).
  if (profile && profile !== syncedProfile) {
    setSyncedProfile(profile);
    setName(profile.name || '');
    setAddress({ ...EMPTY, ...(profile.address || {}) });
  }

  const avatarSrc = (() => {
    const a = profile?.avatar;
    if (!a) return '';
    if (/^https?:\/\//.test(a)) return a;
    return `${API_URL}/images/${a}`;
  })();

  const initials = (name || user?.email || 'U').trim().charAt(0).toUpperCase();

  const onAddressChange = (e) =>
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onPickAvatar = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);
    if (result.success) toast.success('Profile picture updated.');
    else toast.error(result.message || 'Failed to update picture.');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await saveProfile({ name, address: { ...address, email: user?.email || '' } });
    setSaving(false);
    if (result.success) toast.success('Profile saved.');
    else toast.error(result.message || 'Failed to save profile.');
  };

  return (
    <div className='profile'>
      {/* Hero card: avatar + identity */}
      <div className='profile-hero'>
        <div className='profile-avatar-wrap'>
          <div className='profile-avatar'>
            {avatarSrc
              ? <img src={avatarSrc} alt='Profile' />
              : <span className='profile-avatar-initials'>{initials}</span>}
            {uploading && <div className='profile-avatar-loading'>…</div>}
          </div>
          <button
            type='button'
            className='profile-avatar-btn'
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label='Change profile picture'
            title='Change profile picture'
          >
            <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' /><circle cx='12' cy='13' r='4' />
            </svg>
          </button>
          <input ref={fileRef} type='file' accept='image/*' hidden onChange={onPickAvatar} />
        </div>
        <div className='profile-hero-info'>
          <h2>{name || 'Your profile'}</h2>
          <p>{user?.email}</p>
          <span className='profile-hint-inline'>Tap the camera to change your photo</span>
        </div>
      </div>

      {/* Details */}
      <form className='profile-card' onSubmit={onSubmit}>
        <div className='profile-section'>
          <h3>Account</h3>
          <div className='profile-field'>
            <label htmlFor='pf-name'>Full name</label>
            <input id='pf-name' type='text' value={name} onChange={(e) => setName(e.target.value)} placeholder='Your name' />
          </div>
          <div className='profile-field'>
            <label htmlFor='pf-email'>Email</label>
            <input id='pf-email' type='email' value={user?.email || ''} disabled />
            <span className='profile-hint'>Managed by your sign-in account.</span>
          </div>
        </div>

        <div className='profile-section'>
          <h3>Default delivery address</h3>
          <div className='profile-row'>
            <div className='profile-field'>
              <label htmlFor='pf-first'>First name</label>
              <input id='pf-first' name='firstName' value={address.firstName} onChange={onAddressChange} type='text' />
            </div>
            <div className='profile-field'>
              <label htmlFor='pf-last'>Last name</label>
              <input id='pf-last' name='lastName' value={address.lastName} onChange={onAddressChange} type='text' />
            </div>
          </div>

          <div className='profile-field'>
            <label htmlFor='pf-street'>Street</label>
            <input id='pf-street' name='street' value={address.street} onChange={onAddressChange} type='text' />
          </div>

          <div className='profile-row'>
            <div className='profile-field'>
              <label htmlFor='pf-city'>City</label>
              <input id='pf-city' name='city' value={address.city} onChange={onAddressChange} type='text' />
            </div>
            <div className='profile-field'>
              <label htmlFor='pf-state'>State</label>
              <input id='pf-state' name='state' value={address.state} onChange={onAddressChange} type='text' />
            </div>
          </div>

          <div className='profile-row'>
            <div className='profile-field'>
              <label htmlFor='pf-zip'>Zip code</label>
              <input id='pf-zip' name='zipcode' value={address.zipcode} onChange={onAddressChange} type='text' />
            </div>
            <div className='profile-field'>
              <label htmlFor='pf-country'>Country</label>
              <input id='pf-country' name='country' value={address.country} onChange={onAddressChange} type='text' />
            </div>
          </div>

          <div className='profile-field'>
            <label htmlFor='pf-phone'>Phone</label>
            <input id='pf-phone' name='phone' value={address.phone} onChange={onAddressChange} type='tel' />
          </div>
        </div>

        <button type='submit' className='profile-save' disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
