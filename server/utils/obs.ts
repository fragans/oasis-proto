import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let _s3: S3Client

function getS3Client(): S3Client {
  if (!_s3) {
    const config = useRuntimeConfig()
    _s3 = new S3Client({
      endpoint: config.obsEndpoint,
      region: 'ap-southeast-3',
      credentials: {
        accessKeyId: config.obsAccessKeyId,
        secretAccessKey: config.obsSecretAccessKey
      },
      forcePathStyle: false
    })
  }
  return _s3
}

export async function uploadCreative(buffer: Buffer, key: string, mimeType: string) {
  const config = useRuntimeConfig()
  const s3 = getS3Client()

  await s3.send(new PutObjectCommand({
    Bucket: config.obsBucket,
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
    Bucket: config.obsBucket,
    Key: key
  }))
}

export function getPublicUrl(key: string): string {
  const config = useRuntimeConfig()
  return `${config.obsCdnUrl}/${key}`
}
