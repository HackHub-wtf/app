package wtf.hackhub.presentation.organization;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.organization.GetOrgInvitationsUseCase;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Invitation Preview", description = "Public endpoint to preview an invitation before accepting")
@RestController
@RequestMapping("/api/v1/invitations")
public class InvitationPreviewController {

	private final GetOrgInvitationsUseCase getOrgInvitationsUseCase;
	private final OrganizationRepository organizationRepository;

	public InvitationPreviewController(GetOrgInvitationsUseCase getOrgInvitationsUseCase,
			OrganizationRepository organizationRepository) {
		this.getOrgInvitationsUseCase = getOrgInvitationsUseCase;
		this.organizationRepository = organizationRepository;
	}

	@Operation(summary = "Preview an invitation by token (public — no auth required)")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Invitation preview"),
			@ApiResponse(responseCode = "400", description = "Token invalid, expired, or already used")})
	@GetMapping("/{token}")
	public InvitationPreviewResponse preview(@PathVariable String token) {
		OrgInvitation invitation = getOrgInvitationsUseCase.preview(token);

		String orgName = organizationRepository.findById(invitation.getOrganizationId()).map(Organization::getName)
				.orElse("Unknown Organization");

		return new InvitationPreviewResponse(invitation.getOrganizationId(), orgName,
				invitation.getInvitedRole().toDbValue(), invitation.getExpiresAt());
	}

	// ── DTO ───────────────────────────────────────────────────────────────────

	public record InvitationPreviewResponse(UUID organizationId, String organizationName, String invitedRole,
			Instant expiresAt) {
	}
}
