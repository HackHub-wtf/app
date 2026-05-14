package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "token_hash", unique = true, nullable = false)
	private String tokenHash;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "is_revoked", nullable = false)
	private boolean revoked = false;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	protected RefreshToken() {
	}

	public RefreshToken(UUID userId, String tokenHash, Instant expiresAt) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
	}

	public void revoke() {
		this.revoked = true;
	}

	public boolean isExpired() {
		return Instant.now().isAfter(expiresAt);
	}

	public boolean isValid() {
		return !revoked && !isExpired();
	}

	public UUID getId() {
		return id;
	}
	public UUID getUserId() {
		return userId;
	}
	public String getTokenHash() {
		return tokenHash;
	}
	public Instant getExpiresAt() {
		return expiresAt;
	}
	public boolean isRevoked() {
		return revoked;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
}
