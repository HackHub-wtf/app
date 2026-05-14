package wtf.hackhub.application.storage;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class UploadFileUseCase {

	private final StoragePort storagePort;
	private final Tika tika = new Tika();

	public UploadFileUseCase(StoragePort storagePort) {
		this.storagePort = storagePort;
	}

	public record Result(String bucket, String key, String url) {
	}

	/**
	 * Validates MIME type from file bytes (not Content-Type header — that's
	 * client-controlled). Validates file size. Uploads to the appropriate bucket.
	 * Returns a pre-signed URL.
	 */
	public Result execute(MultipartFile file, String bucket, String filenamePrefix) {
		StoragePort.validateSize(file.getSize());

		String detectedMime;
		try {
			detectedMime = tika.detect(file.getInputStream());
		} catch (IOException e) {
			throw new FileReadException(e);
		}
		StoragePort.validateMimeType(detectedMime);

		String extension = extractExtension(file.getOriginalFilename());
		String key = filenamePrefix + "/" + UUID.randomUUID() + extension;

		try {
			storagePort.upload(bucket, key, file.getInputStream(), file.getSize(), detectedMime);
		} catch (IOException e) {
			throw new FileReadException(e);
		}

		String url = storagePort.presignedDownloadUrl(bucket, key, 3600);
		return new Result(bucket, key, url);
	}

	private String extractExtension(String filename) {
		if (filename == null || !filename.contains("."))
			return "";
		return filename.substring(filename.lastIndexOf(".")).toLowerCase();
	}

	public static class FileReadException extends RuntimeException {
		public FileReadException(Throwable cause) {
			super("Failed to read upload stream", cause);
		}
	}
}
