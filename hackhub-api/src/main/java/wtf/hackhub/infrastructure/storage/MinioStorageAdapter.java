package wtf.hackhub.infrastructure.storage;

import io.minio.*;
import io.minio.http.Method;
import org.springframework.stereotype.Component;
import wtf.hackhub.application.storage.StoragePort;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Component
public class MinioStorageAdapter implements StoragePort {

	private final MinioClient minioClient;

	public MinioStorageAdapter(MinioClient minioClient) {
		this.minioClient = minioClient;
	}

	@Override
	public String upload(String bucket, String key, InputStream data, long size, String contentType) {
		try {
			minioClient.putObject(PutObjectArgs.builder().bucket(bucket).object(key).stream(data, size, -1)
					.contentType(contentType).build());
			return key;
		} catch (Exception e) {
			throw new StorageException("Upload failed: " + key, e);
		}
	}

	@Override
	public String presignedDownloadUrl(String bucket, String key, int expirySeconds) {
		try {
			return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder().method(Method.GET)
					.bucket(bucket).object(key).expiry(expirySeconds, TimeUnit.SECONDS).build());
		} catch (Exception e) {
			throw new StorageException("Failed to generate pre-signed URL for: " + key, e);
		}
	}

	@Override
	public void delete(String bucket, String key) {
		try {
			minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
		} catch (Exception e) {
			throw new StorageException("Delete failed: " + key, e);
		}
	}

	@Override
	public void ensureBucketExists(String bucket) {
		try {
			boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
			if (!exists) {
				minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
			}
		} catch (Exception e) {
			throw new StorageException("Failed to ensure bucket exists: " + bucket, e);
		}
	}

	public static class StorageException extends RuntimeException {
		public StorageException(String message, Throwable cause) {
			super(message, cause);
		}
	}
}
