package wtf.hackhub.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests for domain entities that were previously excluded from JaCoCo but need
 * coverage for the overall suite.
 */
class ExcludedDomainEntityTest {

	// ── JudgeScore ────────────────────────────────────────────────────────────

	@Test
	void judge_score_stores_fields() {
		UUID hackathonId = UUID.randomUUID();
		UUID ideaId = UUID.randomUUID();
		UUID judgeId = UUID.randomUUID();
		UUID criterionId = UUID.randomUUID();

		JudgeScore score = new JudgeScore(hackathonId, ideaId, judgeId, criterionId, 7, "Good work");

		assertThat(score.getHackathonId()).isEqualTo(hackathonId);
		assertThat(score.getIdeaId()).isEqualTo(ideaId);
		assertThat(score.getJudgeId()).isEqualTo(judgeId);
		assertThat(score.getCriterionId()).isEqualTo(criterionId);
		assertThat(score.getScore()).isEqualTo(7);
		assertThat(score.getComment()).isEqualTo("Good work");
		assertThat(score.getCreatedAt()).isNotNull();
		assertThat(score.getUpdatedAt()).isNotNull();
		assertThat(score.getId()).isNull();
	}

	@Test
	void judge_score_without_criterion() {
		JudgeScore score = new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 5, null);
		assertThat(score.getCriterionId()).isNull();
		assertThat(score.getComment()).isNull();
	}

	@Test
	void judge_score_valid_range_boundary() {
		assertThat(new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 1, null).getScore())
				.isEqualTo(1);
		assertThat(new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 10, null).getScore())
				.isEqualTo(10);
	}

	@Test
	void judge_score_invalid_throws() {
		assertThatThrownBy(() -> new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 0, null))
				.isInstanceOf(JudgeScore.InvalidScoreException.class);
		assertThatThrownBy(
				() -> new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 11, null))
				.isInstanceOf(JudgeScore.InvalidScoreException.class);
	}

	@Test
	void judge_score_update_changes_score_and_comment() {
		JudgeScore score = new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 5, "OK");
		score.update(9, "Excellent");
		assertThat(score.getScore()).isEqualTo(9);
		assertThat(score.getComment()).isEqualTo("Excellent");
	}

	@Test
	void judge_score_update_invalid_throws() {
		JudgeScore score = new JudgeScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, 5, null);
		assertThatThrownBy(() -> score.update(0, null)).isInstanceOf(JudgeScore.InvalidScoreException.class);
	}

	// ── FinalSubmission ───────────────────────────────────────────────────────

	@Test
	void final_submission_stores_fields() {
		UUID hackathonId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		UUID ideaId = UUID.randomUUID();
		UUID submittedBy = UUID.randomUUID();

		FinalSubmission sub = new FinalSubmission(hackathonId, teamId, ideaId, "My Project", "A great project",
				"[{\"type\":\"github\"}]", submittedBy);

		assertThat(sub.getHackathonId()).isEqualTo(hackathonId);
		assertThat(sub.getTeamId()).isEqualTo(teamId);
		assertThat(sub.getIdeaId()).isEqualTo(ideaId);
		assertThat(sub.getTitle()).isEqualTo("My Project");
		assertThat(sub.getDescription()).isEqualTo("A great project");
		assertThat(sub.getAttachments()).isEqualTo("[{\"type\":\"github\"}]");
		assertThat(sub.getSubmittedBy()).isEqualTo(submittedBy);
		assertThat(sub.getSubmittedAt()).isNotNull();
		assertThat(sub.getUpdatedAt()).isNotNull();
		assertThat(sub.getId()).isNull();
	}

	@Test
	void final_submission_null_attachments_defaults_to_empty_array() {
		FinalSubmission sub = new FinalSubmission(UUID.randomUUID(), UUID.randomUUID(), null, "Title", null, null,
				UUID.randomUUID());
		assertThat(sub.getAttachments()).isEqualTo("[]");
		assertThat(sub.getIdeaId()).isNull();
		assertThat(sub.getDescription()).isNull();
	}

	@Test
	void final_submission_update_changes_fields() {
		FinalSubmission sub = new FinalSubmission(UUID.randomUUID(), UUID.randomUUID(), null, "Old", "Old desc", "[]",
				UUID.randomUUID());
		UUID newIdeaId = UUID.randomUUID();

		sub.update(newIdeaId, "New Title", "New desc", "[{\"type\":\"video\"}]");

		assertThat(sub.getIdeaId()).isEqualTo(newIdeaId);
		assertThat(sub.getTitle()).isEqualTo("New Title");
		assertThat(sub.getDescription()).isEqualTo("New desc");
		assertThat(sub.getAttachments()).isEqualTo("[{\"type\":\"video\"}]");
	}

	@Test
	void final_submission_update_null_attachments_defaults_to_empty_array() {
		FinalSubmission sub = new FinalSubmission(UUID.randomUUID(), UUID.randomUUID(), null, "Title", "Desc", "[]",
				UUID.randomUUID());
		sub.update(null, "Title", "Desc", null);
		assertThat(sub.getAttachments()).isEqualTo("[]");
	}

	// ── OrgInvitation ─────────────────────────────────────────────────────────

	@Test
	void org_invitation_stores_fields() {
		UUID orgId = UUID.randomUUID();
		UUID createdBy = UUID.randomUUID();
		Instant expiresAt = Instant.now().plusSeconds(86400);

		OrgInvitation inv = new OrgInvitation(orgId, createdBy, "TOKEN-ABC", expiresAt, OrganizationMember.Role.MEMBER,
				"bob@example.com");

		assertThat(inv.getOrganizationId()).isEqualTo(orgId);
		assertThat(inv.getCreatedBy()).isEqualTo(createdBy);
		assertThat(inv.getToken()).isEqualTo("TOKEN-ABC");
		assertThat(inv.getExpiresAt()).isEqualTo(expiresAt);
		assertThat(inv.getInvitedRole()).isEqualTo(OrganizationMember.Role.MEMBER);
		assertThat(inv.getInvitedEmail()).isEqualTo("bob@example.com");
		assertThat(inv.getCreatedAt()).isNotNull();
		assertThat(inv.getId()).isNull();
	}

	@Test
	void org_invitation_is_valid_when_fresh() {
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().plusSeconds(3600), OrganizationMember.Role.MEMBER, null);
		assertThat(inv.isValid()).isTrue();
		assertThat(inv.isExpired()).isFalse();
		assertThat(inv.isUsed()).isFalse();
		assertThat(inv.isRevoked()).isFalse();
	}

	@Test
	void org_invitation_is_invalid_when_expired() {
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().minusSeconds(1), OrganizationMember.Role.MEMBER, null);
		assertThat(inv.isExpired()).isTrue();
		assertThat(inv.isValid()).isFalse();
	}

	@Test
	void org_invitation_is_invalid_after_mark_used() {
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().plusSeconds(3600), OrganizationMember.Role.MEMBER, null);
		inv.markUsed();
		assertThat(inv.isUsed()).isTrue();
		assertThat(inv.getUsedAt()).isNotNull();
		assertThat(inv.isValid()).isFalse();
	}

	@Test
	void org_invitation_is_invalid_after_revoke() {
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().plusSeconds(3600), OrganizationMember.Role.MEMBER, null);
		inv.revoke();
		assertThat(inv.isRevoked()).isTrue();
		assertThat(inv.getRevokedAt()).isNotNull();
		assertThat(inv.isValid()).isFalse();
	}

	@Test
	void org_invitation_null_role_defaults_to_member() {
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().plusSeconds(3600), null, null);
		assertThat(inv.getInvitedRole()).isEqualTo(OrganizationMember.Role.MEMBER);
	}

	// ── HackathonJudge ────────────────────────────────────────────────────────

	@Test
	void hackathon_judge_stores_fields() {
		UUID hackathonId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();

		HackathonJudge judge = new HackathonJudge(hackathonId, userId, invitedBy);

		assertThat(judge.getHackathonId()).isEqualTo(hackathonId);
		assertThat(judge.getUserId()).isEqualTo(userId);
		assertThat(judge.getInvitedBy()).isEqualTo(invitedBy);
		assertThat(judge.getInvitedAt()).isNotNull();
		assertThat(judge.getId()).isNull();
	}
}
