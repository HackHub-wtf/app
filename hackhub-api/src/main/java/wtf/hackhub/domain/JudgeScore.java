package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "judge_scores", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id", "judge_id",
		"criterion_id"}))
public class JudgeScore {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "hackathon_id", nullable = false)
	private UUID hackathonId;

	@Column(name = "idea_id", nullable = false)
	private UUID ideaId;

	@Column(name = "judge_id", nullable = false)
	private UUID judgeId;

	@Column(name = "criterion_id")
	private UUID criterionId;

	@Column(nullable = false)
	private int score;

	@Column(columnDefinition = "text")
	private String comment;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected JudgeScore() {
	}

	public JudgeScore(UUID hackathonId, UUID ideaId, UUID judgeId, UUID criterionId, int score, String comment) {
		validateScore(score);
		this.hackathonId = hackathonId;
		this.ideaId = ideaId;
		this.judgeId = judgeId;
		this.criterionId = criterionId;
		this.score = score;
		this.comment = comment;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public void update(int score, String comment) {
		validateScore(score);
		this.score = score;
		this.comment = comment;
	}

	private static void validateScore(int score) {
		if (score < 1 || score > 10) {
			throw new InvalidScoreException(score);
		}
	}

	public UUID getId() {
		return id;
	}
	public UUID getHackathonId() {
		return hackathonId;
	}
	public UUID getIdeaId() {
		return ideaId;
	}
	public UUID getJudgeId() {
		return judgeId;
	}
	public UUID getCriterionId() {
		return criterionId;
	}
	public int getScore() {
		return score;
	}
	public String getComment() {
		return comment;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public static class InvalidScoreException extends RuntimeException {
		public InvalidScoreException(int score) {
			super("Judge score must be between 1 and 10, got: " + score);
		}
	}
}
