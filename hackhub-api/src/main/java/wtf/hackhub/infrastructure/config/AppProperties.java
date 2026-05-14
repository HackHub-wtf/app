package wtf.hackhub.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;
import java.util.Map;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Minio minio) {

	public record Jwt(String privateKey, String publicKey, @DefaultValue("900") long accessTokenExpirySeconds,
			@DefaultValue("604800") long refreshTokenExpirySeconds) {
	}

	public record Cors(@DefaultValue("http://localhost:5173") String allowedOrigins) {
		public List<String> allowedOriginsList() {
			return List.of(allowedOrigins.split(","));
		}
	}

	public record Minio(@DefaultValue("http://localhost:9000") String endpoint, String accessKey, String secretKey,
			Map<String, String> buckets) {
	}
}
