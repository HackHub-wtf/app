package wtf.hackhub.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the JPA AttributeConverter inner classes on all domain enums. No
 * Spring context needed — these are pure value-mapping classes.
 */
class DomainConvertersTest {

	// ── Hackathon.Status ────────────────────────────────────────────────────

	@Test
	void hackathon_status_to_db_values() {
		assertThat(Hackathon.Status.DRAFT.toDbValue()).isEqualTo("draft");
		assertThat(Hackathon.Status.OPEN.toDbValue()).isEqualTo("open");
		assertThat(Hackathon.Status.RUNNING.toDbValue()).isEqualTo("running");
		assertThat(Hackathon.Status.COMPLETED.toDbValue()).isEqualTo("completed");
	}

	@Test
	void hackathon_status_converter_round_trip() {
		var converter = new Hackathon.Status.StatusConverter();
		for (Hackathon.Status status : Hackathon.Status.values()) {
			String col = converter.convertToDatabaseColumn(status);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(status);
		}
	}

	@Test
	void hackathon_status_converter_null_safety() {
		var converter = new Hackathon.Status.StatusConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Idea.Status ─────────────────────────────────────────────────────────

	@Test
	void idea_status_to_db_values() {
		assertThat(Idea.Status.DRAFT.toDbValue()).isEqualTo("draft");
		assertThat(Idea.Status.SUBMITTED.toDbValue()).isEqualTo("submitted");
		assertThat(Idea.Status.IN_PROGRESS.toDbValue()).isEqualTo("in-progress");
		assertThat(Idea.Status.COMPLETED.toDbValue()).isEqualTo("completed");
	}

	@Test
	void idea_status_from_db_value_with_hyphen() {
		assertThat(Idea.Status.fromDbValue("in-progress")).isEqualTo(Idea.Status.IN_PROGRESS);
	}

	@Test
	void idea_status_converter_round_trip() {
		var converter = new Idea.Status.StatusConverter();
		for (Idea.Status status : Idea.Status.values()) {
			String col = converter.convertToDatabaseColumn(status);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(status);
		}
	}

	@Test
	void idea_status_converter_null_safety() {
		var converter = new Idea.Status.StatusConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Notification.Type ────────────────────────────────────────────────────

	@Test
	void notification_type_converter_round_trip() {
		var converter = new Notification.Type.TypeConverter();
		for (Notification.Type type : Notification.Type.values()) {
			String col = converter.convertToDatabaseColumn(type);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(type);
		}
	}

	@Test
	void notification_type_converter_null_safety() {
		var converter = new Notification.Type.TypeConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── OrganizationMember.Role ──────────────────────────────────────────────

	@Test
	void org_member_role_to_db_values() {
		assertThat(OrganizationMember.Role.OWNER.toDbValue()).isEqualTo("owner");
		assertThat(OrganizationMember.Role.MANAGER.toDbValue()).isEqualTo("manager");
		assertThat(OrganizationMember.Role.MEMBER.toDbValue()).isEqualTo("member");
	}

	@Test
	void org_member_role_converter_round_trip() {
		var converter = new OrganizationMember.Role.RoleConverter();
		for (OrganizationMember.Role role : OrganizationMember.Role.values()) {
			String col = converter.convertToDatabaseColumn(role);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(role);
		}
	}

	@Test
	void org_member_role_converter_null_safety() {
		var converter = new OrganizationMember.Role.RoleConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Profile.Role ─────────────────────────────────────────────────────────

	@Test
	void profile_role_to_db_values() {
		assertThat(Profile.Role.ADMIN.toDbValue()).isEqualTo("admin");
		assertThat(Profile.Role.MANAGER.toDbValue()).isEqualTo("manager");
		assertThat(Profile.Role.PARTICIPANT.toDbValue()).isEqualTo("participant");
	}

	@Test
	void profile_role_from_db_value() {
		assertThat(Profile.Role.fromDbValue("admin")).isEqualTo(Profile.Role.ADMIN);
		assertThat(Profile.Role.fromDbValue("MANAGER")).isEqualTo(Profile.Role.MANAGER);
	}

	@Test
	void profile_role_converter_round_trip() {
		var converter = new Profile.Role.RoleConverter();
		for (Profile.Role role : Profile.Role.values()) {
			String col = converter.convertToDatabaseColumn(role);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(role);
		}
	}

	@Test
	void profile_role_converter_null_safety() {
		var converter = new Profile.Role.RoleConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── TeamMember.Role ──────────────────────────────────────────────────────

	@Test
	void team_member_role_to_db_values() {
		assertThat(TeamMember.Role.LEADER.toDbValue()).isEqualTo("leader");
		assertThat(TeamMember.Role.MEMBER.toDbValue()).isEqualTo("member");
	}

	@Test
	void team_member_role_converter_round_trip() {
		var converter = new TeamMember.Role.RoleConverter();
		for (TeamMember.Role role : TeamMember.Role.values()) {
			String col = converter.convertToDatabaseColumn(role);
			assertThat(converter.convertToEntityAttribute(col)).isEqualTo(role);
		}
	}

	@Test
	void team_member_role_converter_null_safety() {
		var converter = new TeamMember.Role.RoleConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}
}
