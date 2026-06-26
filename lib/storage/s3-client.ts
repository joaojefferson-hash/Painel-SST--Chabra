// lib/storage/s3-client.ts -- wrapper S3 que espelha a API do supabase.storage,
// usando @aws-sdk/client-s3 contra o MinIO self-host.
//
// Mantem os call sites inalterados:
//   supabase.storage.from("fotos").upload(path, file, { upsert })
//   supabase.storage.from("fotos").getPublicUrl(path)
//   supabase.storage.from("fotos").remove(paths)
//   supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
//   supabase.storage.from(bucket).download(path)
//
// SEGURANCA: as credenciais sao injetadas por contexto (NAO lidas de env aqui):
//   - browser  -> conta publica (escopo bucket `fotos`, vai no bundle)
//   - server   -> conta server-only (le buckets privados: certificados/pdfs-*)
// Quem decide quais creds usar e o composed client em lib/supabase/client.ts.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface UploadResult {
  data: { path: string } | null;
  error: { message: string; statusCode?: string } | null;
}
export interface PublicUrlResult {
  data: { publicUrl: string };
}
export interface RemoveResult {
  data: { name: string }[] | null;
  error: { message: string } | null;
}
export interface SignedUrlResult {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}
export interface SignedUrlsResult {
  data: { path: string | null; signedUrl: string; error: string | null }[] | null;
  error: { message: string } | null;
}
export interface DownloadResult {
  data: Blob | null;
  error: { message: string } | null;
}
export interface CopyResult {
  data: { path: string } | null;
  error: { message: string } | null;
}

export interface StorageBucketClient {
  upload(
    path: string,
    file: File | Blob | ArrayBuffer | Uint8Array,
    options?: { upsert?: boolean; contentType?: string; cacheControl?: string }
  ): Promise<UploadResult>;
  getPublicUrl(path: string): PublicUrlResult;
  remove(paths: string[]): Promise<RemoveResult>;
  createSignedUrl(path: string, expiresIn: number): Promise<SignedUrlResult>;
  createSignedUrls(paths: string[], expiresIn: number): Promise<SignedUrlsResult>;
  download(path: string): Promise<DownloadResult>;
  copy(fromPath: string, toPath: string): Promise<CopyResult>;
}

export interface StorageNamespace {
  from(bucket: string): StorageBucketClient;
}

export interface StorageConfig {
  endpoint: string; // ex: https://storage.chabra.com.br
  bucket: string; // bucket default; .from() pode sobrescrever
  accessKeyId: string;
  secretAccessKey: string;
  publicEndpoint?: string; // endpoint para getPublicUrl (default = endpoint)
  region?: string;
}

function makeS3Client(config: StorageConfig): S3Client {
  return new S3Client({
    region: config.region ?? "us-east-1",
    endpoint: config.endpoint,
    forcePathStyle: true, // MinIO: bucket no path, nao subdomain
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

async function toUint8Array(
  body: File | Blob | ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new Uint8Array(await (body as Blob).arrayBuffer());
}

export function createStorageNamespace(config: StorageConfig): StorageNamespace {
  const s3 = makeS3Client(config);
  const publicEndpoint = config.publicEndpoint ?? config.endpoint;

  return {
    from(bucket: string): StorageBucketClient {
      return {
        async upload(path, file, options) {
          try {
            if (!options?.upsert) {
              try {
                await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: path }));
                return {
                  data: null,
                  error: { message: "The resource already exists", statusCode: "409" },
                };
              } catch {
                // 404 = nao existe, segue
              }
            }
            const body = await toUint8Array(file);
            const contentType =
              options?.contentType ??
              (file instanceof File || file instanceof Blob ? file.type : undefined) ??
              "application/octet-stream";
            await s3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: path,
                Body: body,
                ContentType: contentType,
                CacheControl: options?.cacheControl,
              })
            );
            return { data: { path }, error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },

        getPublicUrl(path) {
          return { data: { publicUrl: `${publicEndpoint}/${bucket}/${path}` } };
        },

        async remove(paths) {
          if (paths.length === 0) return { data: [], error: null };
          try {
            const result = await s3.send(
              new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: paths.map((Key) => ({ Key })), Quiet: false },
              })
            );
            const deleted = result.Deleted ?? [];
            return { data: deleted.map((d) => ({ name: d.Key ?? "" })), error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },

        async createSignedUrl(path, expiresIn) {
          try {
            const url = await getSignedUrl(
              s3,
              new GetObjectCommand({ Bucket: bucket, Key: path }),
              { expiresIn }
            );
            return { data: { signedUrl: url }, error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },

        async createSignedUrls(paths, expiresIn) {
          try {
            const data = await Promise.all(
              paths.map(async (p) => {
                try {
                  const signedUrl = await getSignedUrl(
                    s3,
                    new GetObjectCommand({ Bucket: bucket, Key: p }),
                    { expiresIn }
                  );
                  return { path: p, signedUrl, error: null };
                } catch (e) {
                  return { path: p, signedUrl: "", error: e instanceof Error ? e.message : String(e) };
                }
              })
            );
            return { data, error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },

        async download(path) {
          try {
            const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
            const body = result.Body;
            if (!body) return { data: null, error: { message: "Empty body" } };
            const bytes = await (
              body as unknown as { transformToByteArray: () => Promise<Uint8Array> }
            ).transformToByteArray();
            const contentType = result.ContentType ?? "application/octet-stream";
            return { data: new Blob([bytes as BlobPart], { type: contentType }), error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },

        async copy(fromPath, toPath) {
          try {
            await s3.send(
              new CopyObjectCommand({
                Bucket: bucket,
                CopySource: `${bucket}/${fromPath}`,
                Key: toPath,
              })
            );
            return { data: { path: toPath }, error: null };
          } catch (e) {
            return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
          }
        },
      };
    },
  };
}
