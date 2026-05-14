package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hackathon_judges", uniqueConstraints = @UniqueConstraint(columnNames = {"hackathon_id", "user_id"}))
public class HackathonJudge {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "hackathon_id", nullable = false)
	private UUID hackathonId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "invited_by")
	private UUID invitedBy;

	@Column(name = "invited_at", nullable = false, updatable = false)
	private Instant invitedAt = Instant.now();

	protected HackathonJudge() {
	}

	public HackathonJudge(UUID hackathonId, UUID userId, UUID invitedBy) {
		this.hackathonId = hackathonId;
		this.userId = userId;
		this.invitedBy = invitedBy;
	}

	public UUID getId() {
		return id;
	}
	public UUID getHackathonId() {
		return hackathonId;
	}
	public UUID getUserId() {
		return userId;
	}
	public UUID getInvitedBy() {
		return invitedBy;
	}
	public Instant getInvitedAt() {
		return invitedAt;
	}
}
