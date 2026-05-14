package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "profiles")
public class Profile {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(unique = true, nullable = false)
	private String email;

	@Column(nullable = false)
	private String name;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "avatar_url")
	private String avatarUrl;

	@Convert(converter = Role.RoleConverter.class)
	@Column(nullable = false)
	private Role role = Role.PARTICIPANT;

	@Column(columnDefinition = "text[]")
	private List<String> skills = List.of();

	@Column(name = "organization_id")
	private UUID organizationId;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt = Instant.now();

	public enum Role {
		ADMIN, MANAGER, PARTICIPANT;

		public String toDbValue() {
			return name().toLowerCase();
		}

		public static Role fromDbValue(String value) {
			return valueOf(value.toUpperCase());
		}

		@jakarta.persistence.Converter(autoApply = true)
		public static class RoleConverter implements jakarta.persistence.AttributeConverter<Role, String> {
			@Override
			public String convertToDatabaseColumn(Role role) {
				return role == null ? null : role.toDbValue();
			}

			@Override
			public Role convertToEntityAttribute(String value) {
				return value == null ? null : Role.fromDbValue(value);
			}
		}
	}

	protected Profile() {
	}

	public Profile(String email, String name, String passwordHash) {
		this.email = email;
		this.name = name;
		this.passwordHash = passwordHash;
		this.role = Role.PARTICIPANT;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}
	public String getEmail() {
		return email;
	}
	public String getName() {
		return name;
	}
	public String getPasswordHash() {
		return passwordHash;
	}
	public String getAvatarUrl() {
		return avatarUrl;
	}
	public Role getRole() {
		return role;
	}
	public List<String> getSkills() {
		return skills;
	}
	public UUID getOrganizationId() {
		return organizationId;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void updateProfile(String name, String avatarUrl, List<String> skills) {
		this.name = name;
		this.avatarUrl = avatarUrl;
		this.skills = skills;
	}

	public void changeRole(Role role) {
		this.role = role;
	}

	public void assignOrganization(UUID organizationId) {
		this.organizationId = organizationId;
	}
}
