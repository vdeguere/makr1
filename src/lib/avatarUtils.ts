import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Get patient initials from full name for avatar fallback
 */
export function getPatientInitials(fullName: string): string {
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

/**
 * Upload patient avatar to storage
 */
export async function uploadPatientAvatar(
  file: File,
  patientId: string
): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
  }

  // Validate file size (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit.');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${patientId}/avatar-${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('patient-avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('patient-avatars')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete patient avatar from storage
 */
export async function deletePatientAvatar(avatarUrl: string): Promise<void> {
  if (!avatarUrl) return;

  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/patient-avatars/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('patient-avatars')
      .remove([filePath]);

    if (error) {
      logger.error('Error deleting avatar:', error);
    }
  } catch (error) {
    logger.error('Error deleting avatar:', error);
  }
}
