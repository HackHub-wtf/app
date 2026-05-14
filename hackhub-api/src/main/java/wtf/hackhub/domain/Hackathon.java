package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "hackathons")
public class Hackathon {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, columnDefinition = "text")
	private String description;

	@Column(name = "start_date", nullable = false)
	private Instant startDate;

	@Column(name = "end_date", nullable = false)
	private Instant endDate;

	@Column(name = "registration_key", unique = true, nullable = false)
	private String registrationKey;

	@Convert(converter = Status.StatusConverter.class)
	@Column(nullable = false)
	private Status status = Status.DRAFT;

	@Column(name = "max_team_size", nullable = false)
	private int maxTeamSize = 4;

	@Column(name = "allowed_participants", nullable = false)
	private int allowedParticipants;

	@Column(name = "current_participants", nullable = false)
	private int currentParticipants = 0;

	@Column(name = "created_by", nullable = false)
	private UUID createdBy;

	@Column(name = "organization_id")
	private UUID organizationId;

	@Column(name = "banner_url")
	private String bannerUrl;

	@Column(columnDefinition = "text")
	private String rules;

	@Column(columnDefinition = "text[]")
	private List<String> prizes = new ArrayList<>();

	@Column(columnDefinition = "text[]")
	private List<String> tags = new ArrayList<>();

	@Convert(converter = Visibility.VisibilityConverter.class)
	@Column(nullable = false)
	private Visibility visibility = Visibility.PRIVATE;

	@Convert(converter = JoinPolicy.JoinPolicyConverter.class)
	@Column(name = "join_policy", nullable = false)
	private JoinPolicy joinPolicy = JoinPolicy.SELF_REGISTER;

	@Convert(converter = JudgingMode.JudgingModeConverter.class)
	@Column(name = "judging_mode", nullable = false)
	private JudgingMode judgingMode = JudgingMode.COMMUNITY;

	@Column(name = "panel_weight", nullable = false)
	private int panelWeight = 70;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	public enum Status {
		DRAFT, OPEN, RUNNING, COMPLETED;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = true)
		public static class StatusConverter implements jakarta.persistence.AttributeConverter<Status, String> {
			@Override
			public String convertToDatabaseColumn(Status status) {
				return status == null ? null : status.toDbValue();
			}

			@Override
			public Status convertToEntityAttribute(String value) {
				return value == null ? null : valueOf(value.toUpperCase());
			}
		}
	}

	protected Hackathon() {
	}

	public Hackathon(String title, String description, Instant startDate, Instant endDate, String registrationKey,
			int maxTeamSize, int allowedParticipants, UUID createdBy, UUID organizationId) {
		this.title = title;
		this.description = description;
		this.startDate = startDate;
		this.endDate = endDate;
		this.registrationKey = registrationKey;
		this.maxTeamSize = maxTeamSize;
		this.allowedParticipants = allowedParticipants;
		this.createdBy = createdBy;
		this.organizationId = organizationId;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	// ── Status machine ────────────────────────────────────────────────────────

	public void open() {
		if (status != Status.DRAFT)
			throw new InvalidTransitionException(status, Status.OPEN);
		this.status = Status.OPEN;
	}

	public void start() {
		if (status != Status.OPEN)
			throw new InvalidTransitionException(status, Status.RUNNING);
		this.status = Status.RUNNING;
	}

	public void complete() {
		if (status != Status.RUNNING)
			throw new InvalidTransitionException(status, Status.COMPLETED);
		this.status = Status.COMPLETED;
	}

	public void incrementParticipants() {
		if (currentParticipants >= allowedParticipants) {
			throw new FullCapacityException(id);
		}
		this.currentParticipants++;
	}

	public void update(String title, String description, Instant startDate, Instant endDate, int maxTeamSize,
			int allowedParticipants, String rules, List<String> prizes, List<String> tags, String bannerUrl) {
		this.title = title;
		this.description = description;
		this.startDate = startDate;
		this.endDate = endDate;
		this.maxTeamSize = maxTeamSize;
		this.allowedParticipants = allowedParticipants;
		this.rules = rules;
		this.prizes = prizes;
		this.tags = tags;
		this.bannerUrl = bannerUrl;
	}

	public void updateJudgingConfig(Visibility visibility, JoinPolicy joinPolicy, JudgingMode judgingMode,
			int panelWeight) {
		this.visibility = visibility;
		this.joinPolicy = joinPolicy;
		this.judgingMode = judgingMode;
		this.panelWeight = panelWeight;
	}

	// ── Getters ───────────────────────────────────────────────────────────────

	public UUID getId() {
		return id;
	}
	public String getTitle() {
		return title;
	}
	public String getDescription() {
		return description;
	}
	public Instant getStartDate() {
		return startDate;
	}
	public Instant getEndDate() {
		return endDate;
	}
	public String getRegistrationKey() {
		return registrationKey;
	}
	public Status getStatus() {
		return status;
	}
	public int getMaxTeamSize() {
		return maxTeamSize;
	}
	public int getAllowedParticipants() {
		return allowedParticipants;
	}
	public int getCurrentParticipants() {
		return currentParticipants;
	}
	public UUID getCreatedBy() {
		return createdBy;
	}
	public UUID getOrganizationId() {
		return organizationId;
	}
	public String getBannerUrl() {
		return bannerUrl;
	}
	public String getRules() {
		return rules;
	}
	public List<String> getPrizes() {
		return prizes;
	}
	public List<String> getTags() {
		return tags;
	}
	public Visibility getVisibility() {
		return visibility;
	}
	public JoinPolicy getJoinPolicy() {
		return joinPolicy;
	}
	public JudgingMode getJudgingMode() {
		return judgingMode;
	}
	public int getPanelWeight() {
		return panelWeight;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public enum Visibility {
		PUBLIC, PRIVATE;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = false)
		public static class VisibilityConverter implements jakarta.persistence.AttributeConverter<Visibility, String> {
			@Override
			public String convertToDatabaseColumn(Visibility v) {
				return v == null ? null : v.toDbValue();
			}

			@Override
			public Visibility convertToEntityAttribute(String s) {
				return s == null ? null : valueOf(s.toUpperCase());
			}
		}
	}

	public enum JoinPolicy {
		INVITE_ONLY, SELF_REGISTER;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = false)
		public static class JoinPolicyConverter implements jakarta.persistence.AttributeConverter<JoinPolicy, String> {
			@Override
			public String convertToDatabaseColumn(JoinPolicy p) {
				return p == null ? null : p.toDbValue();
			}

			@Override
			public JoinPolicy convertToEntityAttribute(String s) {
				return s == null ? null : valueOf(s.toUpperCase());
			}
		}
	}

	public enum JudgingMode {
		PANEL, COMMUNITY, BLENDED;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = false)
		public static class JudgingModeConverter
				implements
					jakarta.persistence.AttributeConverter<JudgingMode, String> {
			@Override
			public String convertToDatabaseColumn(JudgingMode m) {
				return m == null ? null : m.toDbValue();
			}

			@Override
			public JudgingMode convertToEntityAttribute(String s) {
				return s == null ? null : valueOf(s.toUpperCase());
			}
		}
	}

	public static class InvalidTransitionException extends RuntimeException {
		public InvalidTransitionException(Status from, Status to) {
			super("Cannot transition hackathon from " + from + " to " + to);
		}
	}

	public static class FullCapacityException extends RuntimeException {
		public FullCapacityException(UUID id) {
			super("Hackathon " + id + " is at full capacity");
		}
	}
}
