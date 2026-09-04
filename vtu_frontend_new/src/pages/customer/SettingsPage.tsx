import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, KeyRound, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile, useChangePassword, useSetPin, useLogout } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { initials } from '@/utils/format';

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const setPin = useSetPin();
  const logout = useLogout();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [pinForm, setPinForm] = useState({ pin: '' });
  const [modal, setModal] = useState<'profile' | 'password' | 'pin' | null>(null);

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync(profileForm);
      toast.success('Profile updated');
      setModal(null);
    } catch (err) { toast.error(extractError(err)); }
  };

  const savePassword = async () => {
    try {
      await changePassword.mutateAsync(pwForm);
      toast.success('Password changed');
      setModal(null);
      setPwForm({ old_password: '', new_password: '' });
    } catch (err) { toast.error(extractError(err)); }
  };

  const savePin = async () => {
    try {
      await setPin.mutateAsync({ pin: pinForm.pin });
      toast.success('Transaction PIN set');
      setModal(null);
      setPinForm({ pin: '' });
    } catch (err) { toast.error(extractError(err)); }
  };

  const doLogout = async () => {
    await logout.mutateAsync();
    navigate('/login');
  };

  const menuItems = [
    { icon: User, label: 'Edit Profile', onClick: () => setModal('profile') },
    { icon: Lock, label: 'Change Password', onClick: () => setModal('password') },
    { icon: KeyRound, label: 'Transaction PIN', onClick: () => setModal('pin') },

  ];

  return (
    <div className="px-5 pt-8">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <div className="card flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
          {initials(user?.first_name || '', user?.last_name || '')}
        </div>
        <div>
          <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="card w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-muted" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </button>
          );
        })}

        <button onClick={doLogout} className="card w-full flex items-center gap-3 text-error">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Profile modal */}
      <Modal open={modal === 'profile'} onClose={() => setModal(null)} title="Edit Profile">
        <div className="space-y-3">
          <input className="input-field" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} placeholder="First Name" />
          <input className="input-field" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} placeholder="Last Name" />
          <input className="input-field" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" />
          <input className="input-field" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" />
          <Button className="w-full" loading={updateProfile.isPending} onClick={saveProfile}>Save</Button>
        </div>
      </Modal>

      {/* Password modal */}
      <Modal open={modal === 'password'} onClose={() => setModal(null)} title="Change Password">
        <div className="space-y-3">
          <input type="password" className="input-field" value={pwForm.old_password} onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} placeholder="Old password" />
          <input type="password" className="input-field" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="New password" />
          <Button className="w-full" loading={changePassword.isPending} onClick={savePassword}>Change Password</Button>
        </div>
      </Modal>

      {/* PIN modal */}
      <Modal open={modal === 'pin'} onClose={() => setModal(null)} title="Set Transaction PIN">
        <div className="space-y-3">
          <input
            className="input-field text-center text-2xl tracking-widest"
            maxLength={4}
            value={pinForm.pin}
            onChange={(e) => setPinForm({ pin: e.target.value.replace(/\D/g, '') })}
            placeholder="••••"
          />
          <Button className="w-full" loading={setPin.isPending} onClick={savePin} disabled={pinForm.pin.length !== 4}>Set PIN</Button>
        </div>
      </Modal>
    </div>
  );
}
