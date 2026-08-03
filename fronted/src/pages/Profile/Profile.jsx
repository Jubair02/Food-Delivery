import React, { useContext, useMemo, useRef, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const EMPTY = {
  firstName: '', lastName: '', street: '',
  city: '', state: '', zipcode: '', country: '', phone: '',
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // matches the server limit in config/upload.js

/* Field definitions in data, so label, autofill hint and layout stay together.
   `half` means the field shares a row on desktop. */
const ADDRESS_FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name', half: true },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name', half: true },
  { name: 'street', label: 'Street address', autoComplete: 'street-address' },
  { name: 'city', label: 'City', autoComplete: 'address-level2', half: true },
  { name: 'state', label: 'State or region', autoComplete: 'address-level1', half: true },
  { name: 'zipcode', label: 'Zip or postal code', autoComplete: 'postal-code', half: true },
  { name: 'country', label: 'Country', autoComplete: 'country-name', half: true },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
];

/* Profile fields are all optional — you can save a partial profile. So these
   check format only when something has been typed, and never demand a value. */
const VALIDATORS = {
  phone: (v) => {
    const value = String(v || '').trim();
    if (!value) return '';
    return value.replace(/\D/g, '').length >= 7 ? '' : 'Enter a number the rider can call';
  },
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
  const [baseline, setBaseline] = useState({ name: '', address: EMPTY });
  const [errors, setErrors] = useState({});

  // Only signed-in users have a profile.
  React.useEffect(() => {
    if (authReady && !user) navigate('/');
  }, [authReady, user, navigate]);

  // Populate the form once the profile arrives (render-time sync). The same
  // values become the baseline unsaved changes are measured against.
  if (profile && profile !== syncedProfile) {
    setSyncedProfile(profile);
    const next = {
      name: profile.name || '',
      address: { ...EMPTY, ...(profile.address || {}) },
    };
    setName(next.name);
    setAddress(next.address);
    setBaseline(next);
  }

  const avatarSrc = (() => {
    const a = profile?.avatar;
    if (!a) return '';
    if (/^https?:\/\//.test(a)) return a;
    return `${API_URL}/images/${a}`;
  })();

  const initials = (name || user?.email || 'U').trim().charAt(0).toUpperCase();

  // Drives the save bar: nothing to save unless something actually changed.
  const dirty = useMemo(() => {
    if (name !== baseline.name) return true;
    return Object.keys(EMPTY).some((k) => (address[k] || '') !== (baseline.address[k] || ''));
  }, [name, address, baseline]);

  const onAddressChange = (e) => {
    const { name: field, value } = e.target;
    setAddress((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  const onAddressBlur = (e) => {
    const { name: field, value } = e.target;
    if (!VALIDATORS[field]) return;
    setErrors((prev) => ({ ...prev, [field]: VALIDATORS[field](value) }));
  };

  const discard = () => {
    setName(baseline.name);
    setAddress(baseline.address);
    setErrors({});
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    // Checked here so an oversized file fails with a clear reason, not a 500.
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('That image is over 5 MB. Please choose a smaller one.');
      return;
    }
    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);
    if (result.success) toast.success('Profile picture updated.');
    else toast.error(result.message || 'Failed to update picture.');
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const found = {};
    Object.keys(VALIDATORS).forEach((field) => {
      const message = VALIDATORS[field](address[field]);
      if (message) found[field] = message;
    });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(`pf-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setSaving(true);
    const result = await saveProfile({ name, address: { ...address, email: user?.email || '' } });
    setSaving(false);
    if (result.success) {
      setBaseline({ name, address });
      toast.success('Profile saved.');
    } else {
      toast.error(result.message || 'Failed to save profile.');
    }
  };

  return (
    <main className='profile'>
      {/* Identity */}
      <header className='profile-hero'>
        <div className='profile-avatar-wrap'>
          <div className='profile-avatar'>
            {avatarSrc ? (
              <img src={avatarSrc} alt='' />
            ) : (
              <span className='profile-avatar-initials' aria-hidden='true'>
                {initials}
              </span>
            )}
            {uploading && (
              <span className='profile-avatar-loading'>
                <span className='profile-avatar-ring' aria-hidden='true' />
                <span className='profile-sr'>Uploading your picture</span>
              </span>
            )}
          </div>
          <button
            type='button'
            className='profile-avatar-btn'
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label='Change profile picture'
            title='Change profile picture'
          >
            <svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' /><circle cx='12' cy='13' r='4' />
            </svg>
          </button>
          <input ref={fileRef} type='file' accept='image/*' hidden onChange={onPickAvatar} />
        </div>

        <div className='profile-hero-info'>
          <h1>{name || 'Your profile'}</h1>
          <p>{user?.email}</p>
        </div>
      </header>

      {/* Details */}
      <form className='profile-card' onSubmit={onSubmit}>
        <fieldset className='profile-section'>
          <legend>Account</legend>
          <div className='profile-fields'>
            <div className='profile-field is-wide'>
              <label htmlFor='pf-name'>Full name</label>
              <input
                id='pf-name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete='name'
                placeholder='How should we address you?'
              />
            </div>
            <div className='profile-field is-wide'>
              <label htmlFor='pf-email'>Email</label>
              <input id='pf-email' type='email' value={user?.email || ''} disabled />
              <p className='profile-hint'>Managed by your sign-in account.</p>
            </div>
          </div>
        </fieldset>

        <fieldset className='profile-section'>
          <legend>Default delivery address</legend>
          <p className='profile-section-note'>Used to pre-fill checkout. You can change it there.</p>
          <div className='profile-fields'>
            {ADDRESS_FIELDS.map(({ name: field, label, type = 'text', autoComplete, half }) => {
              const error = errors[field];
              return (
                <div
                  key={field}
                  className={`profile-field${half ? '' : ' is-wide'}${error ? ' has-error' : ''}`}
                >
                  <label htmlFor={`pf-${field}`}>{label}</label>
                  <input
                    id={`pf-${field}`}
                    name={field}
                    type={type}
                    value={address[field]}
                    onChange={onAddressChange}
                    onBlur={onAddressBlur}
                    autoComplete={autoComplete}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `pf-${field}-error` : undefined}
                  />
                  {error && (
                    <p className='profile-field-error' id={`pf-${field}-error`}>
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* Sticks to the bottom of the viewport while the form is long, so the
            save action is never a scroll away. */}
        <footer className='profile-bar'>
          <p className={`profile-bar-state${dirty ? ' is-dirty' : ''}`}>
            <span className='profile-bar-dot' aria-hidden='true' />
            {dirty ? 'Unsaved changes' : 'Everything is saved'}
          </p>
          <div className='profile-bar-actions'>
            {dirty && (
              <button type='button' className='profile-discard' onClick={discard} disabled={saving}>
                Discard
              </button>
            )}
            <button type='submit' className='profile-save' disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
};

export default Profile;
