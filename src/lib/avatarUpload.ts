import { supabase } from './supabase';

const BUCKET_NAME = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WebP image' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Image must be less than 2MB' };
  }

  return { valid: true };
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    await deleteOldAvatars(userId);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload image. Please try again.' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      // Try to delete the uploaded file since we couldn't update the profile
      await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      return { success: false, error: 'Failed to update profile. Please try again.' };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete old avatars for a user
 */
async function deleteOldAvatars(userId: string): Promise<void> {
  try {
    // List all files in user's folder
    const { data: files } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (files && files.length > 0) {
      const filesToDelete = files.map(file => `${userId}/${file.name}`);
      await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
    }
  } catch (error) {
    console.error('Error deleting old avatars:', error);
    // Don't throw - continue with upload even if delete fails
  }
}

/**
 * Delete user's avatar completely
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    await deleteOldAvatars(userId);

    // Update user profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    return { success: true };
  } catch (error) {
    console.error('Avatar delete error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get avatar URL or return null for fallback display
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  return avatarUrl;
}

/**
 * Create a preview URL for a file (for showing before upload)
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
