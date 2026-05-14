package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizations")
public class Organization {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(unique = true, nullable = false)
	private String slug;

	private String description;

	@Column(name = "logo_url")
	private String logoUrl;

	@Column(name = "website_url")
	private String websiteUrl;

	@Column(name = "created_by", nullable = false)
	private UUID createdBy;

	@Convert(converter = Visibility.VisibilityConverter.class)
	@Column(nullable = false)
	private Visibility visibility = Visibility.CLOSED;

	@Convert(converter = JoinPolicy.JoinPolicyConverter.class)
	@Column(name = "join_policy", nullable = false)
	private JoinPolicy joinPolicy = JoinPolicy.SELF_REGISTER;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	public enum Visibility {
		OPEN, CLOSED;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = false)
		public static class VisibilityConverter implements AttributeConverter<Visibility, String> {
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
		public static class JoinPolicyConverter implements AttributeConverter<JoinPolicy, String> {
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

	protected Organization() {
	}

	public Organization(String name, String slug, UUID createdBy) {
		this.name = name;
		this.slug = slug;
		this.createdBy = createdBy;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public void update(String name, String description, String logoUrl, String websiteUrl) {
		this.name = name;
		this.description = description;
		this.logoUrl = logoUrl;
		this.websiteUrl = websiteUrl;
	}

	public void updateSettings(Visibility visibility, JoinPolicy joinPolicy) {
		this.visibility = visibility;
		this.joinPolicy = joinPolicy;
	}

	public UUID getId() {
		return id;
	}
	public String getName() {
		return name;
	}
	public String getSlug() {
		return slug;
	}
	public String getDescription() {
		return description;
	}
	public String getLogoUrl() {
		return logoUrl;
	}
	public String getWebsiteUrl() {
		return websiteUrl;
	}
	public UUID getCreatedBy() {
		return createdBy;
	}
	public Visibility getVisibility() {
		return visibility;
	}
	public JoinPolicy getJoinPolicy() {
		return joinPolicy;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
