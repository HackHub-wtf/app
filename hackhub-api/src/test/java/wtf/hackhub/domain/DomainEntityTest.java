package wtf.hackhub.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests for domain entities — no Spring context needed. Covers fields
 * and methods not exercised by other test classes.
 */
class DomainEntityTest {

	// ── IdeaVote ─────────────────────────────────────────────────────────────

	@Test
	void idea_vote_stores_fields() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		IdeaVote vote = new IdeaVote(ideaId, userId);

		assertThat(vote.getIdeaId()).isEqualTo(ideaId);
		assertThat(vote.getUserId()).isEqualTo(userId);
		assertThat(vote.getCreatedAt()).isNotNull();
		assertThat(vote.getId()).isNull(); // not persisted
	}

	// ── RefreshToken ─────────────────────────────────────────────────────────

	@Test
	void refresh_token_is_valid_when_not_revoked_and_not_expired() {
		RefreshToken token = new RefreshToken(UUID.randomUUID(), "hash", Instant.now().plusSeconds(300));

		assertThat(token.isRevoked()).isFalse();
		assertThat(token.isExpired()).isFalse();
		assertThat(token.isValid()).isTrue();
	}

	@Test
	void refresh_token_is_invalid_after_revoke() {
		RefreshToken token = new RefreshToken(UUID.randomUUID(), "hash", Instant.now().plusSeconds(300));
		token.revoke();

		assertThat(token.isRevoked()).isTrue();
		assertThat(token.isValid()).isFalse();
	}

	@Test
	void refresh_token_is_invalid_when_expired() {
		RefreshToken token = new RefreshToken(UUID.randomUUID(), "hash", Instant.now().minusSeconds(1));

		assertThat(token.isExpired()).isTrue();
		assertThat(token.isValid()).isFalse();
	}

	@Test
	void refresh_token_stores_fields() {
		UUID userId = UUID.randomUUID();
		Instant expires = Instant.now().plusSeconds(600);
		RefreshToken token = new RefreshToken(userId, "myhash", expires);

		assertThat(token.getUserId()).isEqualTo(userId);
		assertThat(token.getTokenHash()).isEqualTo("myhash");
		assertThat(token.getExpiresAt()).isEqualTo(expires);
		assertThat(token.getCreatedAt()).isNotNull();
		assertThat(token.getId()).isNull();
	}

	// ── Organization ─────────────────────────────────────────────────────────

	@Test
	void organization_update_changes_fields() {
		UUID createdBy = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", createdBy);

		org.update("Acme Corp", "A corporation", "http://logo.png", "https://acme.com");

		assertThat(org.getName()).isEqualTo("Acme Corp");
		assertThat(org.getDescription()).isEqualTo("A corporation");
		assertThat(org.getLogoUrl()).isEqualTo("http://logo.png");
		assertThat(org.getWebsiteUrl()).isEqualTo("https://acme.com");
	}

	@Test
	void organization_stores_initial_fields() {
		UUID createdBy = UUID.randomUUID();
		Organization org = new Organization("HackOrg", "hackorg", createdBy);

		assertThat(org.getName()).isEqualTo("HackOrg");
		assertThat(org.getSlug()).isEqualTo("hackorg");
		assertThat(org.getCreatedBy()).isEqualTo(createdBy);
		assertThat(org.getCreatedAt()).isNotNull();
		assertThat(org.getUpdatedAt()).isNotNull();
		assertThat(org.getDescription()).isNull();
		assertThat(org.getLogoUrl()).isNull();
		assertThat(org.getWebsiteUrl()).isNull();
	}

	// ── Notification ─────────────────────────────────────────────────────────

	@Test
	void notification_mark_read() {
		Notification notif = new Notification(UUID.randomUUID(), "Title", "Message", Notification.Type.INFO, null);

		assertThat(notif.isRead()).isFalse();
		notif.markRead();
		assertThat(notif.isRead()).isTrue();
	}

	@Test
	void notification_stores_fields() {
		UUID userId = UUID.randomUUID();
		Notification notif = new Notification(userId, "Alert", "Something happened", Notification.Type.WARNING,
				"/action");

		assertThat(notif.getUserId()).isEqualTo(userId);
		assertThat(notif.getTitle()).isEqualTo("Alert");
		assertThat(notif.getMessage()).isEqualTo("Something happened");
		assertThat(notif.getType()).isEqualTo(Notification.Type.WARNING);
		assertThat(notif.getActionUrl()).isEqualTo("/action");
		assertThat(notif.getCreatedAt()).isNotNull();
		assertThat(notif.getId()).isNull();
	}

	// ── OrganizationMember ────────────────────────────────────────────────────

	@Test
	void org_member_change_role() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);

		assertThat(member.getRole()).isEqualTo(OrganizationMember.Role.MEMBER);
		member.changeRole(OrganizationMember.Role.MANAGER);
		assertThat(member.getRole()).isEqualTo(OrganizationMember.Role.MANAGER);
	}

	@Test
	void org_member_stores_fields() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.OWNER);

		assertThat(member.getOrganizationId()).isEqualTo(orgId);
		assertThat(member.getUserId()).isEqualTo(userId);
		assertThat(member.getRole()).isEqualTo(OrganizationMember.Role.OWNER);
		assertThat(member.getJoinedAt()).isNotNull();
		assertThat(member.getId()).isNull();
	}

	// ── Profile ───────────────────────────────────────────────────────────────

	@Test
	void profile_update_and_change_role() {
		Profile p = new Profile("user@test.com", "Alice", "hash");

		p.updateProfile("Bob", "http://avatar.png", List.of("Java", "Python"));
		assertThat(p.getName()).isEqualTo("Bob");
		assertThat(p.getAvatarUrl()).isEqualTo("http://avatar.png");
		assertThat(p.getSkills()).containsExactly("Java", "Python");

		p.changeRole(Profile.Role.ADMIN);
		assertThat(p.getRole()).isEqualTo(Profile.Role.ADMIN);
	}

	@Test
	void profile_assign_organization() {
		Profile p = new Profile("org@test.com", "Carol", "hash");
		assertThat(p.getOrganizationId()).isNull();

		UUID orgId = UUID.randomUUID();
		p.assignOrganization(orgId);
		assertThat(p.getOrganizationId()).isEqualTo(orgId);
	}

	@Test
	void profile_initial_role_is_participant() {
		Profile p = new Profile("x@x.com", "X", "x");
		assertThat(p.getRole()).isEqualTo(Profile.Role.PARTICIPANT);
	}

	// ── ChatMessage ──────────────────────────────────────────────────────────

	@Test
	void chat_message_stores_fields() {
		UUID teamId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		ChatMessage msg = new ChatMessage(teamId, userId, "Hello", "text", null, null);

		assertThat(msg.getTeamId()).isEqualTo(teamId);
		assertThat(msg.getUserId()).isEqualTo(userId);
		assertThat(msg.getContent()).isEqualTo("Hello");
		assertThat(msg.getMessageType()).isEqualTo("text");
		assertThat(msg.getFileUrl()).isNull();
		assertThat(msg.getFileName()).isNull();
		assertThat(msg.getCreatedAt()).isNotNull();
		assertThat(msg.getId()).isNull();
	}

	@Test
	void chat_message_with_file_attachment() {
		UUID teamId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		ChatMessage msg = new ChatMessage(teamId, userId, "See attached", "file", "http://file.url", "doc.pdf");

		assertThat(msg.getMessageType()).isEqualTo("file");
		assertThat(msg.getFileUrl()).isEqualTo("http://file.url");
		assertThat(msg.getFileName()).isEqualTo("doc.pdf");
	}

	// ── Comment ──────────────────────────────────────────────────────────────

	@Test
	void comment_stores_fields() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		Comment comment = new Comment(ideaId, userId, "Great idea!");

		assertThat(comment.getIdeaId()).isEqualTo(ideaId);
		assertThat(comment.getUserId()).isEqualTo(userId);
		assertThat(comment.getContent()).isEqualTo("Great idea!");
		assertThat(comment.getCreatedAt()).isNotNull();
		assertThat(comment.getUpdatedAt()).isNotNull();
		assertThat(comment.getId()).isNull();
	}

	// ── VotingCriteria ────────────────────────────────────────────────────────

	@Test
	void voting_criteria_stores_fields() {
		UUID hackathonId = UUID.randomUUID();

		VotingCriteria criteria = new VotingCriteria(hackathonId, "Innovation", "How innovative is the idea?", 40, 1);

		assertThat(criteria.getHackathonId()).isEqualTo(hackathonId);
		assertThat(criteria.getName()).isEqualTo("Innovation");
		assertThat(criteria.getDescription()).isEqualTo("How innovative is the idea?");
		assertThat(criteria.getWeight()).isEqualTo(40);
		assertThat(criteria.getDisplayOrder()).isEqualTo(1);
		assertThat(criteria.getId()).isNull();
	}

	// ── Team ────────────────────────────────────────────────────────────────

	@Test
	void team_update_changes_fields() {
		UUID hackathonId = UUID.randomUUID();
		UUID createdBy = UUID.randomUUID();
		Team team = new Team("Alpha", "First team", hackathonId, createdBy);

		team.update("Alpha v2", "Updated desc", false, List.of("Java"), "http://avatar.png");

		assertThat(team.getName()).isEqualTo("Alpha v2");
		assertThat(team.getDescription()).isEqualTo("Updated desc");
		assertThat(team.isOpen()).isFalse();
		assertThat(team.getSkills()).containsExactly("Java");
		assertThat(team.getAvatarUrl()).isEqualTo("http://avatar.png");
	}

	@Test
	void team_initial_state() {
		UUID hackathonId = UUID.randomUUID();
		UUID createdBy = UUID.randomUUID();
		Team team = new Team("Beta", "Second team", hackathonId, createdBy);

		assertThat(team.getName()).isEqualTo("Beta");
		assertThat(team.getDescription()).isEqualTo("Second team");
		assertThat(team.getHackathonId()).isEqualTo(hackathonId);
		assertThat(team.getCreatedBy()).isEqualTo(createdBy);
		assertThat(team.isOpen()).isTrue();
		assertThat(team.getCreatedAt()).isNotNull();
		assertThat(team.getUpdatedAt()).isNotNull();
	}

	// ── Hackathon update ────────────────────────────────────────────────────

	@Test
	void hackathon_update_changes_fields() {
		Hackathon h = new Hackathon("Old", "Desc", Instant.now(), Instant.now().plusSeconds(86400), "KEY", 4, 100,
				UUID.randomUUID(), null);

		Instant newStart = Instant.now().plusSeconds(3600);
		Instant newEnd = Instant.now().plusSeconds(90000);
		h.update("New Title", "New Desc", newStart, newEnd, 6, 200, "No rules", List.of("$1000"), List.of("AI"),
				"http://banner.png");

		assertThat(h.getTitle()).isEqualTo("New Title");
		assertThat(h.getDescription()).isEqualTo("New Desc");
		assertThat(h.getStartDate()).isEqualTo(newStart);
		assertThat(h.getEndDate()).isEqualTo(newEnd);
		assertThat(h.getMaxTeamSize()).isEqualTo(6);
		assertThat(h.getAllowedParticipants()).isEqualTo(200);
		assertThat(h.getRules()).isEqualTo("No rules");
		assertThat(h.getPrizes()).containsExactly("$1000");
		assertThat(h.getTags()).containsExactly("AI");
		assertThat(h.getBannerUrl()).isEqualTo("http://banner.png");
	}

	@Test
	void hackathon_update_judging_config() {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "K", 4, 100,
				UUID.randomUUID(), null);

		h.updateJudgingConfig(Hackathon.Visibility.PUBLIC, Hackathon.JoinPolicy.INVITE_ONLY,
				Hackathon.JudgingMode.BLENDED, 60);

		assertThat(h.getVisibility()).isEqualTo(Hackathon.Visibility.PUBLIC);
		assertThat(h.getJoinPolicy()).isEqualTo(Hackathon.JoinPolicy.INVITE_ONLY);
		assertThat(h.getJudgingMode()).isEqualTo(Hackathon.JudgingMode.BLENDED);
		assertThat(h.getPanelWeight()).isEqualTo(60);
	}

	@Test
	void hackathon_default_judging_config() {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "K", 4, 100,
				UUID.randomUUID(), null);

		assertThat(h.getVisibility()).isEqualTo(Hackathon.Visibility.PRIVATE);
		assertThat(h.getJoinPolicy()).isEqualTo(Hackathon.JoinPolicy.SELF_REGISTER);
		assertThat(h.getJudgingMode()).isEqualTo(Hackathon.JudgingMode.COMMUNITY);
		assertThat(h.getPanelWeight()).isEqualTo(70);
	}

	// ── Idea ──────────────────────────────────────────────────────────────────

	@Test
	void idea_initial_state() {
		UUID hackathonId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		UUID createdBy = UUID.randomUUID();

		Idea idea = new Idea("Cool Idea", "A great idea", hackathonId, teamId, createdBy, "AI");

		assertThat(idea.getTitle()).isEqualTo("Cool Idea");
		assertThat(idea.getDescription()).isEqualTo("A great idea");
		assertThat(idea.getHackathonId()).isEqualTo(hackathonId);
		assertThat(idea.getTeamId()).isEqualTo(teamId);
		assertThat(idea.getCreatedBy()).isEqualTo(createdBy);
		assertThat(idea.getCategory()).isEqualTo("AI");
		assertThat(idea.getStatus()).isEqualTo(Idea.Status.DRAFT);
		assertThat(idea.getVotes()).isEqualTo(0);
		assertThat(idea.getTotalScore()).isEqualByComparingTo("0");
		assertThat(idea.getVoteCount()).isEqualTo(0);
		assertThat(idea.getId()).isNull();
	}

	@Test
	void idea_update_changes_fields() {
		Idea idea = new Idea("Old", "Old desc", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Tech");

		idea.update("New Title", "New desc", "Design", List.of("tag1"), Idea.Status.SUBMITTED,
				"https://github.com/repo", "https://demo.example.com", null);

		assertThat(idea.getTitle()).isEqualTo("New Title");
		assertThat(idea.getDescription()).isEqualTo("New desc");
		assertThat(idea.getCategory()).isEqualTo("Design");
		assertThat(idea.getTags()).containsExactly("tag1");
		assertThat(idea.getStatus()).isEqualTo(Idea.Status.SUBMITTED);
		assertThat(idea.getRepositoryUrl()).isEqualTo("https://github.com/repo");
		assertThat(idea.getDemoUrl()).isEqualTo("https://demo.example.com");
	}

	@Test
	void idea_update_score() {
		Idea idea = new Idea("I", "D", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Tech");

		idea.updateScore(new java.math.BigDecimal("8.75"), 15);

		assertThat(idea.getTotalScore()).isEqualByComparingTo("8.75");
		assertThat(idea.getVoteCount()).isEqualTo(15);
	}

	// ── TeamMember ────────────────────────────────────────────────────────────

	@Test
	void team_member_stores_fields() {
		UUID teamId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		TeamMember member = new TeamMember(teamId, userId, TeamMember.Role.LEADER);

		assertThat(member.getTeamId()).isEqualTo(teamId);
		assertThat(member.getUserId()).isEqualTo(userId);
		assertThat(member.getRole()).isEqualTo(TeamMember.Role.LEADER);
		assertThat(member.getJoinedAt()).isNotNull();
		assertThat(member.getId()).isNull();
	}

	// ── Organization settings ─────────────────────────────────────────────────

	@Test
	void organization_update_settings() {
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());

		org.updateSettings(Organization.Visibility.OPEN, Organization.JoinPolicy.SELF_REGISTER);

		assertThat(org.getVisibility()).isEqualTo(Organization.Visibility.OPEN);
		assertThat(org.getJoinPolicy()).isEqualTo(Organization.JoinPolicy.SELF_REGISTER);
	}

	@Test
	void organization_default_settings() {
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());

		assertThat(org.getVisibility()).isEqualTo(Organization.Visibility.CLOSED);
		assertThat(org.getJoinPolicy()).isEqualTo(Organization.JoinPolicy.SELF_REGISTER);
	}

	// ── IdeaScore fields ──────────────────────────────────────────────────────

	@Test
	void idea_score_stores_fields() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		UUID criteriaId = UUID.randomUUID();

		IdeaScore score = new IdeaScore(ideaId, userId, criteriaId, 7);

		assertThat(score.getIdeaId()).isEqualTo(ideaId);
		assertThat(score.getUserId()).isEqualTo(userId);
		assertThat(score.getCriteriaId()).isEqualTo(criteriaId);
		assertThat(score.getScore()).isEqualTo(7);
		assertThat(score.getId()).isNull();
	}
}
