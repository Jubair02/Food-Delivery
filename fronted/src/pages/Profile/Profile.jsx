import React, { useContext, useEffect, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const EMPTY = {
  firstName: '', lastName: '', street: '',
  city: '', state: '', zipcode: '', country: '', phone: '',
};

const Profile = () => {
  const { user, authReady, profile, saveProfile } = useContext(StoreContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [address, setAddress] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [syncedProfile, setSyncedProfile] = useState(null);

  // Only signed-in users have a profile.
  useEffect(() => {
    if (authReady && !user) navigate('/');
  }, [authReady, user, navigate]);

  // Populate the form once the profile arrives (render-time sync on change —
  // React's recommended alternative to a state-setting effect).
  if (profile && profile !== syncedProfile) {
    setSyncedProfile(profile);
    setName(profile.name || '');
    setAddress({ ...EMPTY, ...(profile.address || {}) });
  }

  const onAddressChange = (e) =>
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await saveProfile({
      name,
      address: { ...address, email: user?.email || '' },
    });
    setSaving(false);
    if (result.success) toast.success('Profile saved.');
    else toast.error(result.message || 'Failed to save profile.');
  };

  return (
    <div className='profile'>
      <h2>My Profile</h2>
      <p className='profile-sub'>
        Manage your details. Your delivery address will auto-fill at checkout.
      </p>

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
            <span className='profile-hint'>Email is managed by your sign-in account.</span>
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
