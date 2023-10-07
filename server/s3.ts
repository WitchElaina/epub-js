import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getObjectsFlat() {
  const command = new ListObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
  });
  const response = await s3.send(command);
  return response.Contents?.map((item) => {
    return {
      key: item.Key,
      size: item.Size ? parseFloat((item.Size / 1024 / 1024).toFixed(2)) : 0,
      eTag: JSON.parse(item.ETag || '""'),
    };
  });
}
