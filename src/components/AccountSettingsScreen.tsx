import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Mail, Lock, Camera, LogOut, Trash2, CheckCircle, AlertTriangle, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';
import { signOut, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, deleteAvatar, createPreviewUrl, revokePreviewUrl } from '@/lib/avatarUpload';

interface AccountSettingsScreenProps {
  onBack: () => void;
  userId: string;
  initialDisplayName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
  onProfileUpdate?: (updates: { displayName?: string; avatarUrl?: string | null }) => void;
}

export function AccountSettingsScreen({
  onBack,
  userId,
  initialDisplayName,
  initialEmail,
  initialAvatarUrl,
  onProfileUpdate
}: AccountSettingsScreenProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    displayName: initialDisplayName || '',
    email: initialEmail || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a JPG, PNG, or WebP image' });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    // Clean up old preview
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }

    // Create preview
    const preview = createPreviewUrl(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    setMessage(null);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setIsUploadingPhoto(true);
    setMessage(null);

    const result = await uploadAvatar(userId, selectedFile);

    if (result.success && result.url) {
      setAvatarUrl(result.url);
      setPreviewUrl(null);
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Profile photo updated!' });
      onProfileUpdate?.({ avatarUrl: result.url });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to upload photo' });
    }

    setIsUploadingPhoto(false);
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    setMessage(null);

    const result = await deleteAvatar(userId);

    if (result.success) {
      setAvatarUrl(null);
      setMessage({ type: 'success', text: 'Profile photo removed' });
      onProfileUpdate?.({ avatarUrl: null });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove photo' });
    }

    setIsUploadingPhoto(false);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      revokePreviewUrl(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: profileData.displayName })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      onProfileUpdate?.({ displayName: profileData.displayName });
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
      setMessage({ type: 'error', text: 'Failed to sign out. Please try again.' });
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not logged in');

      // Mark user as deleted (soft delete for data retention)
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      await signOut();
      window.location.reload();
    } catch (err) {
      console.error('Delete account error:', err);
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get display initial for avatar fallback
  const displayInitial = profileData.displayName?.[0]?.toUpperCase() ||
                         profileData.email?.[0]?.toUpperCase() || 'U';

  // Determine which image to show
  const displayImageUrl = previewUrl || avatarUrl;

  return (
    <div className="w-full space-y-6 pb-6 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-black text-white">Account Settings</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-[#50D890]/20 border border-[#50D890]/30'
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-[#50D890]" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-[#50D890]' : 'text-red-400'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Profile Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#4A5FFF]/20 flex items-center justify-center">
            <User className="w-5 h-5 text-[#4A5FFF]" />
          </div>
          <h2 className="text-lg font-bold text-white">Profile Information</h2>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8E53] flex items-center justify-center border-2 border-white/20">
                  <span className="text-2xl font-bold text-white">{displayInitial}</span>
                </div>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl && selectedFile ? (
                // Show save/cancel when there's a preview
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadPhoto}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-[#50D890] rounded-lg text-white font-medium hover:bg-[#50D890]/90 transition-colors disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">Save Photo</span>
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Cancel</span>
                  </button>
                </div>
              ) : (
                // Show change/remove buttons
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">{avatarUrl ? 'Change Photo' : 'Add Photo'}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Remove</span>
                    </button>
                  )}
                </div>
              )}
              <p className="text-white/40 text-xs">JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Display Name</label>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
              placeholder="Enter your display name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Email Address</label>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-white/40" />
              <input
                type="email"
                value={profileData.email}
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 cursor-not-allowed"
              />
            </div>
            <p className="text-white/40 text-xs mt-1">Contact support to change your email</p>
          </div>

          <Button3D
            onClick={handleUpdateProfile}
            disabled={isLoading}
            variant="primary"
            className="w-full mt-4"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button3D>
        </div>
      </GlassCard>

      {/* Password Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <h2 className="text-lg font-bold text-white">Change Password</h2>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#FF6B35]/50 focus:outline-none transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-white/60 text-sm mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 characters)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#FF6B35]/50 focus:outline-none transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#FF6B35]/50 focus:outline-none transition-colors"
            />
          </div>

          <Button3D
            onClick={handleChangePassword}
            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            variant="secondary"
            className="w-full mt-4"
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button3D>
        </div>
      </GlassCard>

      {/* Sign Out & Danger Zone */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-white/60" />
              <span className="text-white">Sign Out</span>
            </div>
            <ArrowLeft className="w-5 h-5 text-white/40 rotate-180" />
          </button>

          {/* Delete Account */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Delete Account</span>
                </div>
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm mb-4">
                  Are you sure? This action cannot be undone. All your data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <Button3D
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button3D>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
