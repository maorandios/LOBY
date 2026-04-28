import { supabase } from '@/lib/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'post-images'

function extFromMime(file: File): string {
  switch (file.type) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/heic':
    case 'image/heif':
      return file.type.endsWith('heic') ? 'heic' : 'heif'
    case 'image/jpeg':
    default:
      return 'jpg'
  }
}

/** Upload `{building_id}/{uuid}.ext`; returns public URL for `posts.image_url`. */
export async function uploadPostImage(
  buildingId: string,
  file: File
): Promise<{ publicUrl: string; path: string } | null> {
  if (!file.size || file.size > MAX_BYTES) return null

  const ext = extFromMime(file)
  const path = `${buildingId}/${crypto.randomUUID()}.${ext}`
  const contentType = file.type || 'image/jpeg'

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: '86400',
    contentType,
  })

  if (error) {
    console.error('[LOBY] uploadPostImage', error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) return null
  return { publicUrl: data.publicUrl, path }
}
