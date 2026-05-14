package wtf.hackhub.presentation.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
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
import wtf.hackhub.application.notification.NotificationService;
import wtf.hackhub.application.organization.AcceptOrgInvitationUseCase;
import wtf.hackhub.application.organization.CreateOrgInvitationUseCase;
import wtf.hackhub.application.organization.CreateOrganizationUseCase;
import wtf.hackhub.application.organization.GetOrgInvitationsUseCase;
import wtf.hackhub.application.organization.JoinOrganizationUseCase;
import wtf.hackhub.application.organization.RevokeOrgInvitationUseCase;
import wtf.hackhub.application.organization.UpdateMemberRoleUseCase;
import wtf.hackhub.application.judging.*;
import wtf.hackhub.application.organization.UpdateOrganizationSettingsUseCase;
import wtf.hackhub.application.profile.UpdateProfileUseCase;
import wtf.hackhub.application.storage.StoragePort;
import wtf.hackhub.application.team.CreateTeamUseCase;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.presentation.judging.FinalSubmissionController;
import wtf.hackhub.application.team.JoinTeamUseCase;
import wtf.hackhub.application.team.LeaveTeamUseCase;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.presentation.storage.StorageController;

import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler({RegisterUseCase.EmailAlreadyRegisteredException.class,
			AdminCreateUserUseCase.EmailAlreadyRegisteredException.class})
	public ProblemDetail handleEmailAlreadyRegistered(RuntimeException ex) {
		ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		problem.setType(URI.create("/errors/email-already-registered"));
		problem.setTitle("Email Already Registered");
		problem.setDetail("An account with this email address already exists.");
		return problem;
	}

	@ExceptionHandler(LoginUseCase.InvalidCredentialsException.class)
	public ProblemDetail handleInvalidCredentials(LoginUseCase.InvalidCredentialsException ex) {
		ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
		problem.setType(URI.create("/errors/invalid-credentials"));
		problem.setTitle("Invalid Credentials");
		problem.setDetail("Email or password is incorrect.");
		return problem;
	}

	@ExceptionHandler(RefreshTokenUseCase.InvalidRefreshTokenException.class)
	public ProblemDetail handleInvalidRefreshToken(RefreshTokenUseCase.InvalidRefreshTokenException ex) {
		ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
		problem.setType(URI.create("/errors/invalid-refresh-token"));
		problem.setTitle("Invalid Refresh Token");
		problem.setDetail("Refresh token is missing, expired, or has already been used.");
		return problem;
	}

	@ExceptionHandler(CreateOrganizationUseCase.SlugAlreadyTakenException.class)
	public ProblemDetail handleSlugTaken(CreateOrganizationUseCase.SlugAlreadyTakenException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/slug-already-taken"));
		p.setTitle("Slug Already Taken");
		p.setDetail("An organization with this slug already exists.");
		return p;
	}

	@ExceptionHandler(JoinOrganizationUseCase.OrganizationNotFoundException.class)
	public ProblemDetail handleOrgNotFound(JoinOrganizationUseCase.OrganizationNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(JoinOrganizationUseCase.AlreadyMemberException.class)
	public ProblemDetail handleAlreadyMember(JoinOrganizationUseCase.AlreadyMemberException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/already-member"));
		p.setTitle("Already a Member");
		p.setDetail("User is already a member of this organization.");
		return p;
	}

	@ExceptionHandler(UpdateMemberRoleUseCase.MemberNotFoundException.class)
	public ProblemDetail handleMemberNotFound(UpdateMemberRoleUseCase.MemberNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Member Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(StoragePort.UnsupportedFileTypeException.class)
	public ProblemDetail handleUnsupportedFileType(StoragePort.UnsupportedFileTypeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
		p.setType(URI.create("/errors/unsupported-file-type"));
		p.setTitle("Unsupported File Type");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(StoragePort.FileTooLargeException.class)
	public ProblemDetail handleFileTooLarge(StoragePort.FileTooLargeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.PAYLOAD_TOO_LARGE);
		p.setType(URI.create("/errors/file-too-large"));
		p.setTitle("File Too Large");
		p.setDetail("Maximum allowed file size is 50 MB.");
		return p;
	}

	@ExceptionHandler(StorageController.InvalidBucketException.class)
	public ProblemDetail handleInvalidBucket(StorageController.InvalidBucketException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-bucket"));
		p.setTitle("Invalid Storage Bucket");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(VoteIdeaUseCase.IdeaNotFoundException.class)
	public ProblemDetail handleIdeaNotFound(VoteIdeaUseCase.IdeaNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(IdeaScore.InvalidScoreException.class)
	public ProblemDetail handleInvalidScore(IdeaScore.InvalidScoreException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-score"));
		p.setTitle("Invalid Score");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(Hackathon.InvalidTransitionException.class)
	public ProblemDetail handleInvalidTransition(Hackathon.InvalidTransitionException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/invalid-status-transition"));
		p.setTitle("Invalid Status Transition");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
		String detail = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> e.getField() + ": " + e.getDefaultMessage()).collect(Collectors.joining(", "));
		ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		problem.setType(URI.create("/errors/validation-failed"));
		problem.setTitle("Validation Failed");
		problem.setDetail(detail);
		return problem;
	}

	@ExceptionHandler(GetHackathonsUseCase.HackathonNotFoundException.class)
	public ProblemDetail handleHackathonNotFound(GetHackathonsUseCase.HackathonNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(JoinHackathonUseCase.InvalidRegistrationKeyException.class)
	public ProblemDetail handleBadRegKey(JoinHackathonUseCase.InvalidRegistrationKeyException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-registration-key"));
		p.setTitle("Invalid Registration Key");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(JoinHackathonUseCase.HackathonNotOpenException.class)
	public ProblemDetail handleHackathonNotOpen(JoinHackathonUseCase.HackathonNotOpenException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/hackathon-not-open"));
		p.setTitle("Hackathon Not Open");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateTeamUseCase.TeamNameTakenException.class)
	public ProblemDetail handleTeamNameTaken(CreateTeamUseCase.TeamNameTakenException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/team-name-taken"));
		p.setTitle("Team Name Taken");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateTeamUseCase.HackathonForTeamNotFoundException.class)
	public ProblemDetail handleHackathonForTeamNotFound(CreateTeamUseCase.HackathonForTeamNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateTeamUseCase.HackathonNotAcceptingTeamsException.class)
	public ProblemDetail handleHackathonNotAcceptingTeams(CreateTeamUseCase.HackathonNotAcceptingTeamsException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/hackathon-not-accepting-teams"));
		p.setTitle("Hackathon Not Accepting Teams");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({JoinTeamUseCase.TeamNotFoundException.class, UpdateProfileUseCase.ProfileNotFoundException.class,
			UpdateUserRoleUseCase.UserNotFoundException.class})
	public ProblemDetail handleGenericNotFound(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({JoinTeamUseCase.TeamClosedException.class, JoinTeamUseCase.AlreadyMemberException.class,
			JoinTeamUseCase.TeamFullException.class, JoinTeamUseCase.AlreadyOnTeamInHackathonException.class,
			LeaveTeamUseCase.LeaderCannotLeaveException.class})
	public ProblemDetail handleTeamConflict(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/team-conflict"));
		p.setTitle("Team Conflict");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({SubmitIdeaUseCase.IdeaTeamHackathonMismatchException.class})
	public ProblemDetail handleTeamHackathonMismatch(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/team-hackathon-mismatch"));
		p.setTitle("Team does not belong to this hackathon");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({SubmitIdeaUseCase.IdeaHackathonNotFoundException.class,
			SubmitIdeaUseCase.IdeaTeamNotFoundException.class})
	public ProblemDetail handleIdeaNotFound(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({SubmitIdeaUseCase.IdeaAccessDeniedException.class,
			NotificationService.NotificationAccessDeniedException.class, AccessDeniedException.class,
			JoinTeamUseCase.NotOrgMemberException.class})
	public ProblemDetail handleAccessDenied(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail("You do not have permission to perform this action.");
		return p;
	}

	@ExceptionHandler(AuthenticationException.class)
	public ProblemDetail handleAuthentication(AuthenticationException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
		p.setType(URI.create("/errors/unauthorized"));
		p.setTitle("Unauthorized");
		p.setDetail("Authentication required.");
		return p;
	}

	@ExceptionHandler({ScoreIdeaUseCase.CriteriaNotFoundException.class,
			ScoreIdeaUseCase.CriteriaMismatchException.class})
	public ProblemDetail handleCriteriaError(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/criteria-error"));
		p.setTitle("Criteria Error");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(AcceptOrgInvitationUseCase.InvalidInvitationTokenException.class)
	public ProblemDetail handleInvalidInvitationToken(AcceptOrgInvitationUseCase.InvalidInvitationTokenException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-invitation-token"));
		p.setTitle("Invalid Invitation Token");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(AcceptOrgInvitationUseCase.InvitationExpiredException.class)
	public ProblemDetail handleInvitationExpired(AcceptOrgInvitationUseCase.InvitationExpiredException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invitation-expired"));
		p.setTitle("Invitation Expired");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateOrgInvitationUseCase.OrganizationNotFoundException.class)
	public ProblemDetail handleInvitationOrgNotFound(CreateOrgInvitationUseCase.OrganizationNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(JoinOrganizationUseCase.JoinNotAllowedException.class)
	public ProblemDetail handleJoinNotAllowed(JoinOrganizationUseCase.JoinNotAllowedException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/join-not-allowed"));
		p.setTitle("Join Not Allowed");
		p.setDetail("This organization requires an invitation to join.");
		return p;
	}

	@ExceptionHandler(UpdateOrganizationSettingsUseCase.NotOwnerException.class)
	public ProblemDetail handleNotOwner(UpdateOrganizationSettingsUseCase.NotOwnerException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail("Only the organization owner can update settings.");
		return p;
	}

	@ExceptionHandler(UpdateOrganizationSettingsUseCase.OrganizationNotFoundException.class)
	public ProblemDetail handleUpdateOrgNotFound(UpdateOrganizationSettingsUseCase.OrganizationNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(InviteJudgeUseCase.NotAuthorizedToInviteException.class)
	public ProblemDetail handleNotAuthorizedToInvite(InviteJudgeUseCase.NotAuthorizedToInviteException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(InviteJudgeUseCase.TargetNotOrgMemberException.class)
	public ProblemDetail handleTargetNotOrgMember(InviteJudgeUseCase.TargetNotOrgMemberException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/not-org-member"));
		p.setTitle("Target Not Org Member");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(RemoveJudgeUseCase.JudgeNotFoundException.class)
	public ProblemDetail handleJudgeNotFound(RemoveJudgeUseCase.JudgeNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(SubmitJudgeScoreUseCase.NotAJudgeException.class)
	public ProblemDetail handleNotAJudge(SubmitJudgeScoreUseCase.NotAJudgeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/not-a-judge"));
		p.setTitle("Not a Judge");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(JudgeScore.InvalidScoreException.class)
	public ProblemDetail handleInvalidJudgeScore(JudgeScore.InvalidScoreException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-score"));
		p.setTitle("Invalid Score");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler({SubmitFinalPresentationUseCase.NotTeamLeaderException.class,
			SubmitFinalPresentationUseCase.NotTeamMemberException.class,
			FinalSubmissionController.NotInATeamException.class})
	public ProblemDetail handleSubmissionForbidden(RuntimeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(SubmitFinalPresentationUseCase.HackathonNotRunningException.class)
	public ProblemDetail handleHackathonNotRunning(SubmitFinalPresentationUseCase.HackathonNotRunningException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/hackathon-not-running"));
		p.setTitle("Hackathon Not Running");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(FinalSubmissionController.SubmissionNotFoundException.class)
	public ProblemDetail handleSubmissionNotFound(FinalSubmissionController.SubmissionNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(UpdateHackathonJudgingConfigUseCase.InvalidPanelWeightException.class)
	public ProblemDetail handleInvalidPanelWeight(UpdateHackathonJudgingConfigUseCase.InvalidPanelWeightException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-panel-weight"));
		p.setTitle("Invalid Panel Weight");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(ManageVotingCriteriaUseCase.WeightExceedsLimitException.class)
	public ProblemDetail handleWeightExceeds(ManageVotingCriteriaUseCase.WeightExceedsLimitException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/weight-limit"));
		p.setTitle("Weight Limit Exceeded");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(NotificationService.NotificationNotFoundException.class)
	public ProblemDetail handleNotifNotFound(NotificationService.NotificationNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateOrgInvitationUseCase.NotAuthorizedToInviteException.class)
	public ProblemDetail handleNotAuthorizedToInvite(CreateOrgInvitationUseCase.NotAuthorizedToInviteException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(CreateOrgInvitationUseCase.RoleEscalationException.class)
	public ProblemDetail handleRoleEscalation(CreateOrgInvitationUseCase.RoleEscalationException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/role-escalation"));
		p.setTitle("Role Escalation Not Allowed");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(RevokeOrgInvitationUseCase.InvitationNotFoundException.class)
	public ProblemDetail handleRevokeInvitationNotFound(RevokeOrgInvitationUseCase.InvitationNotFoundException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		p.setType(URI.create("/errors/not-found"));
		p.setTitle("Not Found");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(RevokeOrgInvitationUseCase.NotAuthorizedToRevokeException.class)
	public ProblemDetail handleNotAuthorizedToRevoke(RevokeOrgInvitationUseCase.NotAuthorizedToRevokeException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		p.setType(URI.create("/errors/forbidden"));
		p.setTitle("Forbidden");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(RevokeOrgInvitationUseCase.InvitationAlreadyProcessedException.class)
	public ProblemDetail handleInvitationAlreadyProcessed(
			RevokeOrgInvitationUseCase.InvitationAlreadyProcessedException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		p.setType(URI.create("/errors/invitation-already-processed"));
		p.setTitle("Invitation Already Processed");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(GetOrgInvitationsUseCase.InvalidTokenException.class)
	public ProblemDetail handlePreviewInvalidToken(GetOrgInvitationsUseCase.InvalidTokenException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/invalid-invitation-token"));
		p.setTitle("Invalid Invitation Token");
		p.setDetail(ex.getMessage());
		return p;
	}

	// Malformed JSON or unreadable request body (e.g. date-only string where
	// Instant is expected)
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/bad-request"));
		p.setTitle("Bad Request");
		p.setDetail(
				"Request body is malformed or contains an invalid value. Check date formats (ISO-8601 required) and enum values.");
		return p;
	}

	// IllegalArgumentException from enum parsing (e.g. invalid role value in
	// invitation)
	@ExceptionHandler(IllegalArgumentException.class)
	public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
		ProblemDetail p = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		p.setType(URI.create("/errors/bad-request"));
		p.setTitle("Bad Request");
		p.setDetail(ex.getMessage());
		return p;
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
		return ProblemDetail.forStatus(ex.getStatusCode());
	}

	@ExceptionHandler(Exception.class)
	public ProblemDetail handleUnexpected(Exception ex) {
		ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
		problem.setType(URI.create("/errors/internal-error"));
		problem.setTitle("Internal Server Error");
		// No detail — never expose stack traces or internal messages
		return problem;
	}
}
