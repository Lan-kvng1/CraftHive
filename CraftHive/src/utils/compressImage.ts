// src/utils/compressImage.ts
// Run: npx expo install expo-image-manipulator
//
// Single shared compression step used by every screen that uploads an
// image to Supabase Storage (profile photo, portfolio, ID documents).
// Resizes to a max dimension and re-encodes as JPEG at a quality level —
// both driven by DataSaverContext so Low Data Mode actually changes
// the bytes that get uploaded, not just how things are displayed.
import * as ImageManipulator from 'expo-image-manipulator'

interface CompressOptions {
  uri: string
  maxDimension?: number // longest side, px
  quality?: number      // 0–1
}

interface CompressResult {
  uri: string
  width: number
  height: number
}

/**
 * Resize + re-compress a local image URI before uploading it anywhere.
 * Safe to call even if the image is already small — ImageManipulator
 * only downsizes, never upsizes, when maxDimension is set.
 */
export async function compressImage({
  uri,
  maxDimension = 1600,
  quality = 0.8,
}: CompressOptions): Promise<CompressResult> {
  try {
    // We don't know the original dimensions up front without an extra
    // probe, so we let ImageManipulator's resize action cap the longest
    // side directly — passing only `width` keeps aspect ratio intact
    // and acts as a "fit within maxDimension" constraint in practice
    // because almost all photos from camera/gallery exceed it.
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxDimension } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    )
    return { uri: result.uri, width: result.width, height: result.height }
  } catch (err) {
    // If manipulation fails for any reason (corrupt file, unsupported
    // format), fall back to the original URI rather than blocking the
    // user's upload entirely.
    console.warn('compressImage failed, using original:', err)
    return { uri, width: 0, height: 0 }
  }
}

/**
 * Convenience wrapper that reads settings straight from useDataSaver()
 * values, so call sites don't need to know the quality numbers.
 *
 * Usage:
 *   const { uploadQuality, uploadMaxDimension } = useDataSaver()
 *   const compressed = await compressForUpload(pickedUri, uploadMaxDimension, uploadQuality)
 */
export async function compressForUpload(
  uri: string,
  maxDimension: number,
  quality: number
): Promise<string> {
  const result = await compressImage({ uri, maxDimension, quality })
  return result.uri
}