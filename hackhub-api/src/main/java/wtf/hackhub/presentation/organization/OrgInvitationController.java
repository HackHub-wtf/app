package wtf.hackhub.presentation.organization;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.organization.AcceptOrgInvitationUseCase;
import wtf.hackhub.application.organization.CreateOrgInvitationUseCase;
import wtf.hackhub.application.organization.GetOrgInvitationsUseCase;
import wtf.hackhub.application.organization.RevokeOrgInvitationUseCase;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Organization Invitations", description = "Create, list, revoke, and accept organization invite links")
@RestController
@RequestMapping("/api/v1/organizations")
public class OrgInvitationController {

	private final CreateOrgInvitationUseCase createOrgInvitationUseCase;
	private final AcceptOrgInvitationUseCase acceptOrgInvitationUseCase;
	private final RevokeOrgInvitationUseCase revokeOrgInvitationUseCase;
	private final GetOrgInvitationsUseCase getOrgInvitationsUseCase;

	public OrgInvitationController(CreateOrgInvitationUseCase createOrgInvitationUseCase,
			AcceptOrgInvitationUseCase acceptOrgInvitationUseCase,
			RevokeOrgInvitationUseCase revokeOrgInvitationUseCase, GetOrgInvitationsUseCase getOrgInvitationsUseCase) {
		this.createOrgInvitationUseCase = createOrgInvitationUseCase;
		this.acceptOrgInvitationUseCase = acceptOrgInvitationUseCase;
		this.revokeOrgInvitationUseCase = revokeOrgInvitationUseCase;
		this.getOrgInvitationsUseCase = getOrgInvitationsUseCase;
	}

	@Operation(summary = "Create an invitation token for an organization")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Invitation created"),
			@ApiResponse(responseCode = "400", description = "Validation error"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Not an owner or manager of this organization"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@PostMapping("/{id}/invitations")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("(hasRole('ADMIN') or hasRole('MANAGER')) and @orgSecurity.isOrgOwnerOrManager(#id, authentication)")
	public InvitationResponse createInvitation(@PathVariable UUID id,
			@Valid @RequestBody CreateInvitationRequest request, @AuthenticationPrincipal UUID userId) {
		OrgInvitation invitation = createOrgInvitationUseCase.execute(id, userId, request.resolvedRole(),
				request.invitedEmail());
		return InvitationResponse.from(invitation);
	}

	@Operation(summary = "List pending invitations for an organization")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "List of pending invitations"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Not an owner or manager of this organization")})
	@GetMapping("/{id}/invitations")
	@PreAuthorize("(hasRole('ADMIN') or hasRole('MANAGER')) and @orgSecurity.isOrgOwnerOrManager(#id, authentication)")
	public List<InvitationResponse> listInvitations(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		return getOrgInvitationsUseCase.getPending(id, userId).stream().map(InvitationResponse::from).toList();
	}

	@Operation(summary = "Revoke a pending invitation")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Invitation revoked"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Not an owner or manager"),
			@ApiResponse(responseCode = "404", description = "Invitation not found"),
			@ApiResponse(responseCode = "409", description = "Invitation already used or revoked")})
	@DeleteMapping("/{id}/invitations/{invId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("(hasRole('ADMIN') or hasRole('MANAGER')) and @orgSecurity.isOrgOwnerOrManager(#id, authentication)")
	public void revokeInvitation(@PathVariable UUID id, @PathVariable UUID invId,
			@AuthenticationPrincipal UUID userId) {
		revokeOrgInvitationUseCase.execute(id, invId, userId);
	}

	@Operation(summary = "Accept an organization invitation using a token")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Joined organization"),
			@ApiResponse(responseCode = "400", description = "Token invalid, used, revoked, or expired"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "409", description = "Already a member")})
	@PostMapping("/accept-invitation")
	public MemberResponse acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request,
			@AuthenticationPrincipal UUID userId) {
		OrganizationMember member = acceptOrgInvitationUseCase.execute(request.token(), userId);
		return MemberResponse.from(member);
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record CreateInvitationRequest(@NotBlank String invitedRole, String invitedEmail) {
		OrganizationMember.Role resolvedRole() {
			try {
				return OrganizationMember.Role.valueOf(invitedRole.toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("Invalid role: " + invitedRole);
			}
		}
	}

	public record InvitationResponse(UUID id, String token, String invitedRole, String invitedEmail, Instant expiresAt,
			Instant createdAt, String joinUrl) {
		static InvitationResponse from(OrgInvitation inv) {
			return new InvitationResponse(inv.getId(), inv.getToken(), inv.getInvitedRole().toDbValue(),
					inv.getInvitedEmail(), inv.getExpiresAt(), inv.getCreatedAt(), "/invite/" + inv.getToken());
		}
	}

	public record AcceptInvitationRequest(@NotBlank String token) {
	}
}
