package wtf.hackhub.infrastructure.storage;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import wtf.hackhub.application.storage.StoragePort;
import wtf.hackhub.infrastructure.config.AppProperties;

@Component
public class BucketInitializer {

	private static final Logger log = LoggerFactory.getLogger(BucketInitializer.class);

	private final StoragePort storagePort;
	private final AppProperties properties;

	public BucketInitializer(StoragePort storagePort, AppProperties properties) {
		this.storagePort = storagePort;
		this.properties = properties;
	}

	@PostConstruct
	void init() {
		if (properties.minio().buckets() == null)
			return;
		properties.minio().buckets().values().forEach(bucket -> {
			try {
				storagePort.ensureBucketExists(bucket);
				log.info("Storage bucket ready: {}", bucket);
			} catch (Exception e) {
				log.warn("Could not ensure bucket '{}': {}", bucket, e.getMessage());
			}
		});
	}
}
