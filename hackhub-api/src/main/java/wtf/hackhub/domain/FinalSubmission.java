package wtf.hackhub.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "final_submissions", uniqueConstraints = @UniqueConstraint(columnNames = {"hackathon_id", "team_id"}))
public class FinalSubmission {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "hackathon_id", nullable = false)
	private UUID hackathonId;

	@Column(name = "team_id", nullable = false)
	private UUID teamId;

	@Column(name = "idea_id")
	private UUID ideaId;

	@Column(nullable = false, columnDefinition = "text")
	private String title;

	@Column(columnDefinition = "text")
	private String description;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb", nullable = false)
	private String attachments = "[]";

	@Column(name = "submitted_by", nullable = false)
	private UUID submittedBy;

	@Column(name = "submitted_at", nullable = false, updatable = false)
	private Instant submittedAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected FinalSubmission() {
	}

	public FinalSubmission(UUID hackathonId, UUID teamId, UUID ideaId, String title, String description,
			String attachments, UUID submittedBy) {
		this.hackathonId = hackathonId;
		this.teamId = teamId;
		this.ideaId = ideaId;
		this.title = title;
		this.description = description;
		this.attachments = attachments != null ? attachments : "[]";
		this.submittedBy = submittedBy;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public void update(UUID ideaId, String title, String description, String attachments) {
		this.ideaId = ideaId;
		this.title = title;
		this.description = description;
		this.attachments = attachments != null ? attachments : "[]";
	}

	public UUID getId() {
		return id;
	}
	public UUID getHackathonId() {
		return hackathonId;
	}
	public UUID getTeamId() {
		return teamId;
	}
	public UUID getIdeaId() {
		return ideaId;
	}
	public String getTitle() {
		return title;
	}
	public String getDescription() {
		return description;
	}
	public String getAttachments() {
		return attachments;
	}
	public UUID getSubmittedBy() {
		return submittedBy;
	}
	public Instant getSubmittedAt() {
		return submittedAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
