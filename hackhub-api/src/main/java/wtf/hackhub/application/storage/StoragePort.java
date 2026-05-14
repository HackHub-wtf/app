package wtf.hackhub.application.storage;

import java.io.InputStream;
import java.util.Set;

/**
 * Port interface — use cases depend on this, not on MinIO SDK directly.
 * Implemented by MinioStorageAdapter in infrastructure layer.
 */
public interface StoragePort {

	/**
	 * Upload a file. Returns the storage key (path within the bucket).
	 */
	String upload(String bucket, String key, InputStream data, long size, String contentType);

	/**
	 * Generate a pre-signed download URL valid for the given duration.
	 */
	String presignedDownloadUrl(String bucket, String key, int expirySeconds);

	/**
	 * Delete an object from storage.
	 */
	void delete(String bucket, String key);

	/**
	 * Ensure a bucket exists, creating it if necessary.
	 */
	void ensureBucketExists(String bucket);

	Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
			"application/pdf", "text/plain", "text/markdown", "application/zip", "application/x-zip-compressed",
			"video/mp4", "video/webm", "application/octet-stream");

	long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB

	static void validateMimeType(String mimeType) {
		if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
			throw new UnsupportedFileTypeException(mimeType);
		}
	}

	static void validateSize(long size) {
		if (size > MAX_FILE_SIZE_BYTES) {
			throw new FileTooLargeException(size, MAX_FILE_SIZE_BYTES);
		}
	}

	class UnsupportedFileTypeException extends RuntimeException {
		public UnsupportedFileTypeException(String mimeType) {
			super("Unsupported file type: " + mimeType);
		}
	}

	class FileTooLargeException extends RuntimeException {
		public FileTooLargeException(long size, long max) {
			super(String.format("File size %d bytes exceeds maximum %d bytes", size, max));
		}
	}
}
