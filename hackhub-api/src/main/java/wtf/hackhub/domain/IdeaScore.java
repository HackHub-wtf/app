package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_scores", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id", "user_id", "criteria_id"}))
public class IdeaScore {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "idea_id", nullable = false)
	private UUID ideaId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "criteria_id", nullable = false)
	private UUID criteriaId;

	@Column(nullable = false)
	private int score;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected IdeaScore() {
	}

	public IdeaScore(UUID ideaId, UUID userId, UUID criteriaId, int score) {
		validateScore(score);
		this.ideaId = ideaId;
		this.userId = userId;
		this.criteriaId = criteriaId;
		this.score = score;
	}

	public void updateScore(int score) {
		validateScore(score);
		this.score = score;
		this.updatedAt = Instant.now();
	}

	private static void validateScore(int score) {
		if (score < 1 || score > 10) {
			throw new InvalidScoreException(score);
		}
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
	public UUID getCriteriaId() {
		return criteriaId;
	}
	public int getScore() {
		return score;
	}

	public static class InvalidScoreException extends RuntimeException {
		public InvalidScoreException(int score) {
			super("Score must be between 1 and 10, got: " + score);
		}
	}
}
