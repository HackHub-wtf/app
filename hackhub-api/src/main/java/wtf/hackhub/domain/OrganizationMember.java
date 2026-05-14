package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_members", uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id",
		"user_id"}))
public class OrganizationMember {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "organization_id", nullable = false)
	private UUID organizationId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Convert(converter = Role.RoleConverter.class)
	@Column(nullable = false)
	private Role role = Role.MEMBER;

	@Column(name = "joined_at", nullable = false, updatable = false)
	private Instant joinedAt = Instant.now();

	public enum Role {
		OWNER, MANAGER, MEMBER, JUDGE;

		public String toDbValue() {
			return name().toLowerCase();
		}

		@jakarta.persistence.Converter(autoApply = true)
		public static class RoleConverter implements jakarta.persistence.AttributeConverter<Role, String> {
			@Override
			public String convertToDatabaseColumn(Role role) {
				return role == null ? null : role.toDbValue();
			}

			@Override
			public Role convertToEntityAttribute(String value) {
				return value == null ? null : valueOf(value.toUpperCase());
			}
		}
	}

	protected OrganizationMember() {
	}

	public OrganizationMember(UUID organizationId, UUID userId, Role role) {
		this.organizationId = organizationId;
		this.userId = userId;
		this.role = role;
	}

	public void changeRole(Role role) {
		this.role = role;
	}

	public UUID getId() {
		return id;
	}
	public UUID getOrganizationId() {
		return organizationId;
	}
	public UUID getUserId() {
		return userId;
	}
	public Role getRole() {
		return role;
	}
	public Instant getJoinedAt() {
		return joinedAt;
	}
}
