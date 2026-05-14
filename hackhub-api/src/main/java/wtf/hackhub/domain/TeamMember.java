package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_members", uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "user_id"}))
public class TeamMember {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "team_id", nullable = false)
	private UUID teamId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Convert(converter = Role.RoleConverter.class)
	@Column(nullable = false)
	private Role role = Role.MEMBER;

	@Column(name = "joined_at", nullable = false, updatable = false)
	private Instant joinedAt = Instant.now();

	public enum Role {
		LEADER, MEMBER;

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

	protected TeamMember() {
	}

	public TeamMember(UUID teamId, UUID userId, Role role) {
		this.teamId = teamId;
		this.userId = userId;
		this.role = role;
	}

	public UUID getId() {
		return id;
	}
	public UUID getTeamId() {
		return teamId;
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
