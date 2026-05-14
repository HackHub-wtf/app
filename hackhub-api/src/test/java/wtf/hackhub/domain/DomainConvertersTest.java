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

	// ── Hackathon.Visibility ──────────────────────────────────────────────────

	@Test
	void hackathon_visibility_to_db_values() {
		assertThat(Hackathon.Visibility.PUBLIC.toDbValue()).isEqualTo("public");
		assertThat(Hackathon.Visibility.PRIVATE.toDbValue()).isEqualTo("private");
	}

	@Test
	void hackathon_visibility_converter_round_trip() {
		var converter = new Hackathon.Visibility.VisibilityConverter();
		for (Hackathon.Visibility v : Hackathon.Visibility.values()) {
			assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(v))).isEqualTo(v);
		}
	}

	@Test
	void hackathon_visibility_converter_null_safety() {
		var converter = new Hackathon.Visibility.VisibilityConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Hackathon.JoinPolicy ──────────────────────────────────────────────────

	@Test
	void hackathon_join_policy_to_db_values() {
		assertThat(Hackathon.JoinPolicy.INVITE_ONLY.toDbValue()).isEqualTo("invite_only");
		assertThat(Hackathon.JoinPolicy.SELF_REGISTER.toDbValue()).isEqualTo("self_register");
	}

	@Test
	void hackathon_join_policy_converter_round_trip() {
		var converter = new Hackathon.JoinPolicy.JoinPolicyConverter();
		for (Hackathon.JoinPolicy p : Hackathon.JoinPolicy.values()) {
			assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(p))).isEqualTo(p);
		}
	}

	@Test
	void hackathon_join_policy_converter_null_safety() {
		var converter = new Hackathon.JoinPolicy.JoinPolicyConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Hackathon.JudgingMode ─────────────────────────────────────────────────

	@Test
	void hackathon_judging_mode_to_db_values() {
		assertThat(Hackathon.JudgingMode.PANEL.toDbValue()).isEqualTo("panel");
		assertThat(Hackathon.JudgingMode.COMMUNITY.toDbValue()).isEqualTo("community");
		assertThat(Hackathon.JudgingMode.BLENDED.toDbValue()).isEqualTo("blended");
	}

	@Test
	void hackathon_judging_mode_converter_round_trip() {
		var converter = new Hackathon.JudgingMode.JudgingModeConverter();
		for (Hackathon.JudgingMode m : Hackathon.JudgingMode.values()) {
			assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(m))).isEqualTo(m);
		}
	}

	@Test
	void hackathon_judging_mode_converter_null_safety() {
		var converter = new Hackathon.JudgingMode.JudgingModeConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Organization.Visibility ───────────────────────────────────────────────

	@Test
	void org_visibility_to_db_values() {
		assertThat(Organization.Visibility.OPEN.toDbValue()).isEqualTo("open");
		assertThat(Organization.Visibility.CLOSED.toDbValue()).isEqualTo("closed");
	}

	@Test
	void org_visibility_converter_round_trip() {
		var converter = new Organization.Visibility.VisibilityConverter();
		for (Organization.Visibility v : Organization.Visibility.values()) {
			assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(v))).isEqualTo(v);
		}
	}

	@Test
	void org_visibility_converter_null_safety() {
		var converter = new Organization.Visibility.VisibilityConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}

	// ── Organization.JoinPolicy ───────────────────────────────────────────────

	@Test
	void org_join_policy_to_db_values() {
		assertThat(Organization.JoinPolicy.INVITE_ONLY.toDbValue()).isEqualTo("invite_only");
		assertThat(Organization.JoinPolicy.SELF_REGISTER.toDbValue()).isEqualTo("self_register");
	}

	@Test
	void org_join_policy_converter_round_trip() {
		var converter = new Organization.JoinPolicy.JoinPolicyConverter();
		for (Organization.JoinPolicy p : Organization.JoinPolicy.values()) {
			assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(p))).isEqualTo(p);
		}
	}

	@Test
	void org_join_policy_converter_null_safety() {
		var converter = new Organization.JoinPolicy.JoinPolicyConverter();
		assertThat(converter.convertToDatabaseColumn(null)).isNull();
		assertThat(converter.convertToEntityAttribute(null)).isNull();
	}
}
