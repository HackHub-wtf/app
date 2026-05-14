package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "teams", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "hackathon_id"}))
public class Team {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "hackathon_id", nullable = false)
	private UUID hackathonId;

	@Column(name = "created_by", nullable = false)
	private UUID createdBy;

	@Column(name = "is_open", nullable = false)
	private boolean open = true;

	@Column(columnDefinition = "text[]")
	private List<String> skills = new ArrayList<>();

	@Column(name = "avatar_url")
	private String avatarUrl;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	protected Team() {
	}

	public Team(String name, String description, UUID hackathonId, UUID createdBy) {
		this.name = name;
		this.description = description;
		this.hackathonId = hackathonId;
		this.createdBy = createdBy;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public void update(String name, String description, boolean open, List<String> skills, String avatarUrl) {
		this.name = name;
		this.description = description;
		this.open = open;
		this.skills = skills;
		this.avatarUrl = avatarUrl;
	}

	public UUID getId() {
		return id;
	}
	public String getName() {
		return name;
	}
	public String getDescription() {
		return description;
	}
	public UUID getHackathonId() {
		return hackathonId;
	}
	public UUID getCreatedBy() {
		return createdBy;
	}
	public boolean isOpen() {
		return open;
	}
	public List<String> getSkills() {
		return skills;
	}
	public String getAvatarUrl() {
		return avatarUrl;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
