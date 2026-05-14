package wtf.hackhub.infrastructure.storage;

import io.minio.MinioClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import wtf.hackhub.infrastructure.config.AppProperties;

@Configuration
public class MinioConfig {

	@Bean
	public MinioClient minioClient(AppProperties properties) {
		return MinioClient.builder().endpoint(properties.minio().endpoint())
				.credentials(properties.minio().accessKey(), properties.minio().secretKey()).build();
	}
}
