package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "idea_id", nullable = false)
	private UUID ideaId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected Comment() {
	}

	public Comment(UUID ideaId, UUID userId, String content) {
		this.ideaId = ideaId;
		this.userId = userId;
		this.content = content;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}
	public UUID getIdeaId() {
		return ideaId;
	}
	public UUID getUserId() {
		return userId;
	}
	public String getContent() {
		return content;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
