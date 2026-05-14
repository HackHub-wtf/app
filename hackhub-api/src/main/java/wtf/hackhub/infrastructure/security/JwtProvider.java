package wtf.hackhub.infrastructure.security;

import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.config.AppProperties;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtProvider {

	private final PrivateKey privateKey;
	private final PublicKey publicKey;
	private final long accessTokenExpirySeconds;

	public JwtProvider(AppProperties properties) {
		this.privateKey = parsePrivateKey(properties.jwt().privateKey());
		this.publicKey = parsePublicKey(properties.jwt().publicKey());
		this.accessTokenExpirySeconds = properties.jwt().accessTokenExpirySeconds();
	}

	public String issueAccessToken(Profile profile) {
		Instant now = Instant.now();
		return Jwts.builder().subject(profile.getId().toString()).claim("email", profile.getEmail())
				.claim("name", profile.getName()).claim("role", profile.getRole().toDbValue())
				.claim("organizationId",
						profile.getOrganizationId() != null ? profile.getOrganizationId().toString() : null)
				.issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(accessTokenExpirySeconds)))
				.signWith(privateKey, Jwts.SIG.RS256).compact();
	}

	public Claims validateAndExtract(String token) {
		return Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token).getPayload();
	}

	public UUID extractUserId(Claims claims) {
		return UUID.fromString(claims.getSubject());
	}

	public String extractRole(Claims claims) {
		return claims.get("role", String.class);
	}

	// ── key parsing ────────────────────────────────────────────────────────────

	private static PrivateKey parsePrivateKey(String pem) {
		try {
			String cleaned = pem.replace("-----BEGIN RSA PRIVATE KEY-----", "")
					.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END RSA PRIVATE KEY-----", "")
					.replace("-----END PRIVATE KEY-----", "").replaceAll("\\s", "");
			byte[] encoded = Base64.getDecoder().decode(cleaned);
			KeyFactory kf = KeyFactory.getInstance("RSA");
			return kf.generatePrivate(new PKCS8EncodedKeySpec(encoded));
		} catch (Exception e) {
			throw new IllegalStateException("Failed to parse JWT private key", e);
		}
	}

	private static PublicKey parsePublicKey(String pem) {
		try {
			String cleaned = pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "")
					.replaceAll("\\s", "");
			byte[] encoded = Base64.getDecoder().decode(cleaned);
			KeyFactory kf = KeyFactory.getInstance("RSA");
			return kf.generatePublic(new X509EncodedKeySpec(encoded));
		} catch (Exception e) {
			throw new IllegalStateException("Failed to parse JWT public key", e);
		}
	}
}
