package wtf.hackhub.presentation.storage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import wtf.hackhub.application.storage.StoragePort;
import wtf.hackhub.application.storage.UploadFileUseCase;
import wtf.hackhub.infrastructure.config.AppProperties;

import java.util.Map;
import java.util.Set;

@Tag(name = "Storage", description = "File upload and download via MinIO")
@RestController
@RequestMapping("/api/v1/storage")
public class StorageController {

	private static final Set<String> VALID_BUCKETS = Set.of("hackhub-avatars", "hackhub-team-files",
			"hackhub-hackathon-assets", "hackhub-project-attachments", "hackhub-team-avatars");

	private final UploadFileUseCase uploadFileUseCase;
	private final StoragePort storagePort;
	private final AppProperties properties;

	public StorageController(UploadFileUseCase uploadFileUseCase, StoragePort storagePort, AppProperties properties) {
		this.uploadFileUseCase = uploadFileUseCase;
		this.storagePort = storagePort;
		this.properties = properties;
	}

	@Operation(summary = "Upload a file to a storage bucket")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "File uploaded"),
			@ApiResponse(responseCode = "400", description = "Unknown bucket or missing file"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping(value = "/upload/{bucketKey}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public UploadResponse upload(@PathVariable String bucketKey, @RequestParam("file") MultipartFile file,
			@RequestParam(value = "prefix", defaultValue = "uploads") String prefix) {

		String bucket = resolveBucket(bucketKey);
		UploadFileUseCase.Result result = uploadFileUseCase.execute(file, bucket, prefix);
		return new UploadResponse(result.key(), result.url());
	}

	@Operation(summary = "Get a presigned download URL for a stored file")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "URL generated"),
			@ApiResponse(responseCode = "400", description = "Unknown bucket"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/url/{bucketKey}")
	public Map<String, String> presignedUrl(@PathVariable String bucketKey, @RequestParam String key,
			@RequestParam(defaultValue = "3600") int expirySeconds) {
		String bucket = resolveBucket(bucketKey);
		String url = storagePort.presignedDownloadUrl(bucket, key, expirySeconds);
		return Map.of("url", url);
	}

	private String resolveBucket(String bucketKey) {
		// Accept either bucket alias (from AppProperties) or direct bucket name
		Map<String, String> configured = properties.minio().buckets();
		if (configured != null && configured.containsKey(bucketKey)) {
			return configured.get(bucketKey);
		}
		if (VALID_BUCKETS.contains(bucketKey))
			return bucketKey;
		throw new InvalidBucketException(bucketKey);
	}

	public record UploadResponse(String key, String url) {
	}

	public static class InvalidBucketException extends RuntimeException {
		public InvalidBucketException(String bucket) {
			super("Unknown storage bucket: " + bucket);
		}
	}
}
