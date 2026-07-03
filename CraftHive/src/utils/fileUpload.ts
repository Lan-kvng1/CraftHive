// src/utils/fileUpload.ts
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

function base64ToByteArray(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const base64dec1 = lookup[base64.charCodeAt(i)];
    const base64dec2 = lookup[base64.charCodeAt(i + 1)];
    const base64dec3 = lookup[base64.charCodeAt(i + 2)];
    const base64dec4 = lookup[base64.charCodeAt(i + 3)];
    
    bytes[p++] = (base64dec1 << 2) | (base64dec2 >> 4);
    if (p < bufferLength) bytes[p++] = ((base64dec2 & 15) << 4) | (base64dec3 >> 2);
    if (p < bufferLength) bytes[p++] = ((base64dec3 & 3) << 6) | (base64dec4);
  }
  return bytes;
}

/**
 * Uploads a local file URI to the specified Supabase Storage bucket.
 * Returns the public URL on success, or null on failure.
 */
export async function uploadToSupabase(
  uri: string,
  bucket: string,
  path: string,
  contentType: string
): Promise<string | null> {
  try {
    if (!uri) return null;

    // Already a remote URL — nothing to upload
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // We use Expo's FileSystem.uploadAsync to upload the file directly.
    // This correctly streams the binary data (fixing the 0-byte bug) AND allows us to
    // set the exact Content-Type (which fixes the Row-Level Security policy error).
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    // Fallback to EXPO_PUBLIC environment variables if not directly available
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nbjretwmzpyclsgmqaqe.supabase.co';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ianJldHdtenB5Y2xzZ21xYXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDU4ODYsImV4cCI6MjA5NTcyMTg4Nn0.NsLtaJAcwJMg8Y3UfC2ZFwtucNrAbbrqk_xlCtAef6c';
    
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    
    const response = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${token || anonKey}`,
        apikey: anonKey,
        'Content-Type': contentType,
        'x-upsert': 'true', // Allows overwriting if a file exists
      },
    });

    if (response.status !== 200) {
      console.error(`Supabase upload error [${bucket}]:`, response.body);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('uploadToSupabase exception:', err);
    return null;
  }
}
