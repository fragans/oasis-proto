import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let _s3: S3Client

function getS3Client(): S3Client {
  if (!_s3) {
    const config = useRuntimeConfig()
    _s3 = new S3Client({
      endpoint: config.s3Endpoint || undefined,
      region: config.s3Region || 'ap-southeast-3',
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey
      },
      forcePathStyle: false // Default to virtual-hosted style (standard for AWS S3)
    })
  }
  return _s3
}

export async function uploadCreative(buffer: Buffer, key: string, mimeType: string) {
  const config = useRuntimeConfig()
  const s3 = getS3Client()

  await s3.send(new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType
  }))

  return getPublicUrl(key)
}

export async function deleteCreative(key: string) {
  const config = useRuntimeConfig()
  const s3 = getS3Client()

  await s3.send(new DeleteObjectCommand({
    Bucket: config.s3Bucket,
    Key: key
  }))
}

export function getPublicUrl(key: string): string {
  const config = useRuntimeConfig()
  if (config.s3CdnUrl) {
    return `${config.s3CdnUrl}/${key}`
  }

  // Fallback to S3 direct URL if no CDN is provided
  const region = config.s3Region || 'ap-southeast-3'
  return `https://${config.s3Bucket}.s3.${region}.amazonaws.com/${key}`
}
