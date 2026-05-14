package wtf.hackhub.presentation.common;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.mockito.Mockito;

import wtf.hackhub.application.admin.AdminCreateUserUseCase;
import wtf.hackhub.application.admin.UpdateUserRoleUseCase;
import wtf.hackhub.application.auth.LoginUseCase;
import wtf.hackhub.application.auth.RefreshTokenUseCase;
import wtf.hackhub.application.auth.RegisterUseCase;
import wtf.hackhub.application.hackathon.GetHackathonsUseCase;
import wtf.hackhub.application.hackathon.JoinHackathonUseCase;
import wtf.hackhub.application.idea.ManageVotingCriteriaUseCase;
import wtf.hackhub.application.idea.ScoreIdeaUseCase;
import wtf.hackhub.application.idea.SubmitIdeaUseCase;
import wtf.hackhub.application.idea.VoteIdeaUseCase;
import wtf.hackhub.application.judging.InviteJudgeUseCase;
import wtf.hackhub.application.judging.RemoveJudgeUseCase;
import wtf.hackhub.application.judging.SubmitFinalPresentationUseCase;
import wtf.hackhub.application.judging.SubmitJudgeScoreUseCase;
import wtf.hackhub.application.judging.UpdateHackathonJudgingConfigUseCase;
import wtf.hackhub.application.notification.NotificationService;
import wtf.hackhub.application.organization.AcceptOrgInvitationUseCase;
import wtf.hackhub.application.organization.CreateOrgInvitationUseCase;
import wtf.hackhub.application.organization.CreateOrganizationUseCase;
import wtf.hackhub.application.organization.GetOrgInvitationsUseCase;
import wtf.hackhub.application.organization.JoinOrganizationUseCase;
import wtf.hackhub.application.organization.RevokeOrgInvitationUseCase;
import wtf.hackhub.application.organization.UpdateMemberRoleUseCase;
import wtf.hackhub.application.organization.UpdateOrganizationSettingsUseCase;
import wtf.hackhub.application.profile.UpdateProfileUseCase;
import wtf.hackhub.application.storage.StoragePort;
import wtf.hackhub.application.team.CreateTeamUseCase;
import wtf.hackhub.application.team.JoinTeamUseCase;
import wtf.hackhub.application.team.LeaveTeamUseCase;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.presentation.judging.FinalSubmissionController;
import wtf.hackhub.presentation.storage.StorageController;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	// ── Auth ──────────────────────────────────────────────────────────────────

	@Test
	void handles_register_email_already_registered() {
		ProblemDetail p = handler
				.handleEmailAlreadyRegistered(new RegisterUseCase.EmailAlreadyRegisteredException("x@x.com"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
		assertThat(p.getTitle()).isEqualTo("Email Already Registered");
	}

	@Test
	void handles_admin_create_user_email_already_registered() {
		ProblemDetail p = handler
				.handleEmailAlreadyRegistered(new AdminCreateUserUseCase.EmailAlreadyRegisteredException("x@x.com"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_invalid_credentials() {
		ProblemDetail p = handler.handleInvalidCredentials(new LoginUseCase.InvalidCredentialsException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
		assertThat(p.getTitle()).isEqualTo("Invalid Credentials");
	}

	@Test
	void handles_invalid_refresh_token() {
		ProblemDetail p = handler.handleInvalidRefreshToken(new RefreshTokenUseCase.InvalidRefreshTokenException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
		assertThat(p.getTitle()).isEqualTo("Invalid Refresh Token");
	}

	// ── Organization ──────────────────────────────────────────────────────────

	@Test
	void handles_slug_taken() {
		ProblemDetail p = handler.handleSlugTaken(new CreateOrganizationUseCase.SlugAlreadyTakenException("my-org"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
		assertThat(p.getTitle()).isEqualTo("Slug Already Taken");
	}

	@Test
	void handles_org_not_found() {
		ProblemDetail p = handler
				.handleOrgNotFound(new JoinOrganizationUseCase.OrganizationNotFoundException("my-org"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_already_member() {
		ProblemDetail p = handler.handleAlreadyMember(
				new JoinOrganizationUseCase.AlreadyMemberException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
		assertThat(p.getTitle()).isEqualTo("Already a Member");
	}

	@Test
	void handles_member_not_found() {
		ProblemDetail p = handler.handleMemberNotFound(
				new UpdateMemberRoleUseCase.MemberNotFoundException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_join_not_allowed() {
		ProblemDetail p = handler
				.handleJoinNotAllowed(new JoinOrganizationUseCase.JoinNotAllowedException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_update_org_settings_not_owner() {
		ProblemDetail p = handler.handleNotOwner(
				new UpdateOrganizationSettingsUseCase.NotOwnerException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_update_org_not_found() {
		ProblemDetail p = handler.handleUpdateOrgNotFound(
				new UpdateOrganizationSettingsUseCase.OrganizationNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	// ── Storage ───────────────────────────────────────────────────────────────

	@Test
	void handles_unsupported_file_type() {
		ProblemDetail p = handler
				.handleUnsupportedFileType(new StoragePort.UnsupportedFileTypeException("application/exe"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
	}

	@Test
	void handles_file_too_large() {
		ProblemDetail p = handler.handleFileTooLarge(new StoragePort.FileTooLargeException(100L, 50L));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE.value());
	}

	@Test
	void handles_invalid_bucket() {
		ProblemDetail p = handler.handleInvalidBucket(new StorageController.InvalidBucketException("bad-bucket"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	// ── Ideas / Voting ────────────────────────────────────────────────────────

	@Test
	void handles_idea_not_found_from_vote() {
		ProblemDetail p = handler.handleIdeaNotFound(new VoteIdeaUseCase.IdeaNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_invalid_idea_score() {
		ProblemDetail p = handler.handleInvalidScore(new IdeaScore.InvalidScoreException(0));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_invalid_status_transition() {
		ProblemDetail p = handler.handleInvalidTransition(
				new Hackathon.InvalidTransitionException(Hackathon.Status.DRAFT, Hackathon.Status.COMPLETED));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_weight_exceeds_limit() {
		ProblemDetail p = handler
				.handleWeightExceeds(new ManageVotingCriteriaUseCase.WeightExceedsLimitException(80, 40));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_criteria_not_found() {
		ProblemDetail p = handler
				.handleCriteriaError(new ScoreIdeaUseCase.CriteriaNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_criteria_mismatch() {
		ProblemDetail p = handler.handleCriteriaError(
				new ScoreIdeaUseCase.CriteriaMismatchException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	// ── Hackathon ─────────────────────────────────────────────────────────────

	@Test
	void handles_hackathon_not_found() {
		ProblemDetail p = handler
				.handleHackathonNotFound(new GetHackathonsUseCase.HackathonNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_invalid_registration_key() {
		ProblemDetail p = handler.handleBadRegKey(new JoinHackathonUseCase.InvalidRegistrationKeyException("BAD-KEY"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_hackathon_not_open() {
		ProblemDetail p = handler.handleHackathonNotOpen(
				new JoinHackathonUseCase.HackathonNotOpenException(UUID.randomUUID(), Hackathon.Status.DRAFT));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	// ── Team ──────────────────────────────────────────────────────────────────

	@Test
	void handles_team_name_taken() {
		ProblemDetail p = handler
				.handleTeamNameTaken(new CreateTeamUseCase.TeamNameTakenException("Alpha", UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_hackathon_for_team_not_found() {
		ProblemDetail p = handler.handleHackathonForTeamNotFound(
				new CreateTeamUseCase.HackathonForTeamNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_hackathon_not_accepting_teams() {
		ProblemDetail p = handler.handleHackathonNotAcceptingTeams(
				new CreateTeamUseCase.HackathonNotAcceptingTeamsException(UUID.randomUUID(), Hackathon.Status.DRAFT));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_team_not_found() {
		ProblemDetail p = handler.handleGenericNotFound(new JoinTeamUseCase.TeamNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_profile_not_found() {
		ProblemDetail p = handler
				.handleGenericNotFound(new UpdateProfileUseCase.ProfileNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_user_not_found() {
		ProblemDetail p = handler
				.handleGenericNotFound(new UpdateUserRoleUseCase.UserNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_team_closed() {
		ProblemDetail p = handler.handleTeamConflict(new JoinTeamUseCase.TeamClosedException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_already_on_team_in_hackathon() {
		ProblemDetail p = handler.handleTeamConflict(
				new JoinTeamUseCase.AlreadyOnTeamInHackathonException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_team_full() {
		ProblemDetail p = handler.handleTeamConflict(new JoinTeamUseCase.TeamFullException(UUID.randomUUID(), 4));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_leader_cannot_leave() {
		ProblemDetail p = handler
				.handleTeamConflict(new LeaveTeamUseCase.LeaderCannotLeaveException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	// ── Idea submission ───────────────────────────────────────────────────────

	@Test
	void handles_idea_hackathon_not_found() {
		ProblemDetail p = handler
				.handleIdeaNotFound(new SubmitIdeaUseCase.IdeaHackathonNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_idea_team_not_found() {
		ProblemDetail p = handler
				.handleIdeaNotFound(new SubmitIdeaUseCase.IdeaTeamNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_idea_team_hackathon_mismatch() {
		ProblemDetail p = handler.handleTeamHackathonMismatch(
				new SubmitIdeaUseCase.IdeaTeamHackathonMismatchException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_idea_access_denied() {
		ProblemDetail p = handler.handleAccessDenied(
				new SubmitIdeaUseCase.IdeaAccessDeniedException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_notification_access_denied() {
		ProblemDetail p = handler.handleAccessDenied(
				new NotificationService.NotificationAccessDeniedException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_spring_access_denied() {
		ProblemDetail p = handler.handleAccessDenied(new AccessDeniedException("denied"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_not_org_member_join_team() {
		ProblemDetail p = handler
				.handleAccessDenied(new JoinTeamUseCase.NotOrgMemberException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_authentication_exception() {
		ProblemDetail p = handler.handleAuthentication(Mockito.mock(AuthenticationException.class));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
	}

	// ── Invitations ───────────────────────────────────────────────────────────

	@Test
	void handles_invalid_invitation_token() {
		ProblemDetail p = handler
				.handleInvalidInvitationToken(new AcceptOrgInvitationUseCase.InvalidInvitationTokenException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_invitation_expired() {
		ProblemDetail p = handler.handleInvitationExpired(new AcceptOrgInvitationUseCase.InvitationExpiredException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_invitation_org_not_found() {
		ProblemDetail p = handler.handleInvitationOrgNotFound(
				new CreateOrgInvitationUseCase.OrganizationNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_not_authorized_to_invite_create() {
		ProblemDetail p = handler
				.handleNotAuthorizedToInvite(new CreateOrgInvitationUseCase.NotAuthorizedToInviteException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_role_escalation() {
		ProblemDetail p = handler.handleRoleEscalation(new CreateOrgInvitationUseCase.RoleEscalationException(
				wtf.hackhub.domain.OrganizationMember.Role.MANAGER, wtf.hackhub.domain.OrganizationMember.Role.OWNER));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_revoke_invitation_not_found() {
		ProblemDetail p = handler
				.handleRevokeInvitationNotFound(new RevokeOrgInvitationUseCase.InvitationNotFoundException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_not_authorized_to_revoke() {
		ProblemDetail p = handler
				.handleNotAuthorizedToRevoke(new RevokeOrgInvitationUseCase.NotAuthorizedToRevokeException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_invitation_already_processed() {
		ProblemDetail p = handler
				.handleInvitationAlreadyProcessed(new RevokeOrgInvitationUseCase.InvitationAlreadyProcessedException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_preview_invalid_token() {
		ProblemDetail p = handler.handlePreviewInvalidToken(new GetOrgInvitationsUseCase.InvalidTokenException());
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	// ── Judging ───────────────────────────────────────────────────────────────

	@Test
	void handles_not_authorized_to_invite_judge() {
		ProblemDetail p = handler
				.handleNotAuthorizedToInvite(new InviteJudgeUseCase.NotAuthorizedToInviteException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_target_not_org_member() {
		ProblemDetail p = handler
				.handleTargetNotOrgMember(new InviteJudgeUseCase.TargetNotOrgMemberException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_judge_not_found() {
		ProblemDetail p = handler.handleJudgeNotFound(
				new RemoveJudgeUseCase.JudgeNotFoundException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_not_a_judge() {
		ProblemDetail p = handler
				.handleNotAJudge(new SubmitJudgeScoreUseCase.NotAJudgeException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_invalid_judge_score() {
		ProblemDetail p = handler.handleInvalidJudgeScore(new JudgeScore.InvalidScoreException(0));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	@Test
	void handles_submission_forbidden_not_leader() {
		ProblemDetail p = handler.handleSubmissionForbidden(
				new SubmitFinalPresentationUseCase.NotTeamLeaderException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_submission_forbidden_not_member() {
		ProblemDetail p = handler.handleSubmissionForbidden(
				new SubmitFinalPresentationUseCase.NotTeamMemberException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_submission_forbidden_not_in_team() {
		ProblemDetail p = handler.handleSubmissionForbidden(
				new FinalSubmissionController.NotInATeamException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
	}

	@Test
	void handles_hackathon_not_running() {
		ProblemDetail p = handler.handleHackathonNotRunning(
				new SubmitFinalPresentationUseCase.HackathonNotRunningException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
	}

	@Test
	void handles_submission_not_found() {
		ProblemDetail p = handler.handleSubmissionNotFound(
				new FinalSubmissionController.SubmissionNotFoundException(UUID.randomUUID(), UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	@Test
	void handles_invalid_panel_weight() {
		ProblemDetail p = handler
				.handleInvalidPanelWeight(new UpdateHackathonJudgingConfigUseCase.InvalidPanelWeightException(150));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
	}

	// ── Notifications ─────────────────────────────────────────────────────────

	@Test
	void handles_notification_not_found() {
		ProblemDetail p = handler
				.handleNotifNotFound(new NotificationService.NotificationNotFoundException(UUID.randomUUID()));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
	}

	// ── HTTP / Framework ──────────────────────────────────────────────────────

	@Test
	void handles_validation_exception_formats_field_errors() {
		var bindingResult = new BeanPropertyBindingResult(new Object(), "request");
		bindingResult.addError(new FieldError("request", "email", "must not be blank"));
		bindingResult.addError(new FieldError("request", "name", "size must be between 1 and 100"));
		var ex = Mockito.mock(MethodArgumentNotValidException.class);
		Mockito.when(ex.getBindingResult()).thenReturn(bindingResult);

		ProblemDetail p = handler.handleValidation(ex);
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
		assertThat(p.getDetail()).contains("email").contains("name");
	}

	@Test
	void handles_http_message_not_readable() {
		var ex = Mockito.mock(HttpMessageNotReadableException.class);
		ProblemDetail p = handler.handleUnreadable(ex);
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
		assertThat(p.getTitle()).isEqualTo("Bad Request");
	}

	@Test
	void handles_illegal_argument() {
		ProblemDetail p = handler.handleIllegalArgument(new IllegalArgumentException("bad value"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
		assertThat(p.getDetail()).isEqualTo("bad value");
	}

	@Test
	void handles_response_status_exception() {
		ProblemDetail p = handler.handleResponseStatus(new ResponseStatusException(HttpStatus.NOT_ACCEPTABLE));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.NOT_ACCEPTABLE.value());
	}

	@Test
	void handles_unexpected_exception_hides_detail() {
		ProblemDetail p = handler.handleUnexpected(new RuntimeException("secret internal error"));
		assertThat(p.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
		assertThat(p.getDetail()).isNull();
	}
}
