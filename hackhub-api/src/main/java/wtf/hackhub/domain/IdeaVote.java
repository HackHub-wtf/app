package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id", "user_id"}))
public class IdeaVote {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "idea_id", nullable = false)
	private UUID ideaId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	protected IdeaVote() {
	}

	public IdeaVote(UUID ideaId, UUID userId) {
		this.ideaId = ideaId;
		this.userId = userId;
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
	public Instant getCreatedAt() {
		return createdAt;
	}
}
