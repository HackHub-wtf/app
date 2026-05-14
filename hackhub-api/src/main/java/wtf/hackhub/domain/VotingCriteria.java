package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "voting_criteria", uniqueConstraints = @UniqueConstraint(columnNames = {"hackathon_id", "name"}))
public class VotingCriteria {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "hackathon_id", nullable = false)
	private UUID hackathonId;

	@Column(nullable = false)
	private String name;

	@Column(columnDefinition = "text")
	private String description;

	@Column(nullable = false)
	private int weight;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected VotingCriteria() {
	}

	public VotingCriteria(UUID hackathonId, String name, String description, int weight, int displayOrder) {
		this.hackathonId = hackathonId;
		this.name = name;
		this.description = description;
		this.weight = weight;
		this.displayOrder = displayOrder;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}
	public UUID getHackathonId() {
		return hackathonId;
	}
	public String getName() {
		return name;
	}
	public String getDescription() {
		return description;
	}
	public int getWeight() {
		return weight;
	}
	public int getDisplayOrder() {
		return displayOrder;
	}
}
