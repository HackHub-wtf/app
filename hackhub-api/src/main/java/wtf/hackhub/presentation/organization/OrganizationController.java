package wtf.hackhub.presentation.organization;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.NotBlank;
import wtf.hackhub.application.organization.*;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.application.organization.UpdateOrganizationSettingsUseCase;

import java.util.List;
import java.util.UUID;

@Tag(name = "Organizations", description = "Organization management and membership")
@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

	private final CreateOrganizationUseCase createOrganizationUseCase;
	private final JoinOrganizationUseCase joinOrganizationUseCase;
	private final GetOrganizationUseCase getOrganizationUseCase;
	private final UpdateMemberRoleUseCase updateMemberRoleUseCase;
	private final UpdateOrganizationSettingsUseCase updateOrganizationSettingsUseCase;

	public OrganizationController(CreateOrganizationUseCase createOrganizationUseCase,
			JoinOrganizationUseCase joinOrganizationUseCase, GetOrganizationUseCase getOrganizationUseCase,
			UpdateMemberRoleUseCase updateMemberRoleUseCase,
			UpdateOrganizationSettingsUseCase updateOrganizationSettingsUseCase) {
		this.createOrganizationUseCase = createOrganizationUseCase;
		this.joinOrganizationUseCase = joinOrganizationUseCase;
		this.getOrganizationUseCase = getOrganizationUseCase;
		this.updateMemberRoleUseCase = updateMemberRoleUseCase;
		this.updateOrganizationSettingsUseCase = updateOrganizationSettingsUseCase;
	}

	@Operation(summary = "Create a new organization")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Organization created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "409", description = "Slug already taken")})
	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public OrgResponse create(@Valid @RequestBody CreateOrgRequest request, @AuthenticationPrincipal UUID userId) {
		Organization org = createOrganizationUseCase.execute(request.name(), request.slug(), userId);
		return OrgResponse.from(org);
	}

	@Operation(summary = "Join an organization by slug")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Joined organization"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@PostMapping("/join")
	@ResponseStatus(HttpStatus.CREATED)
	public MemberResponse join(@Valid @RequestBody JoinOrgRequest request, @AuthenticationPrincipal UUID userId) {
		OrganizationMember member = joinOrganizationUseCase.execute(request.slug(), userId);
		return MemberResponse.from(member);
	}

	@Operation(summary = "List organizations the current user belongs to")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping("/my")
	public List<OrgResponse> getMyOrganizations(@AuthenticationPrincipal UUID userId) {
		return getOrganizationUseCase.getMyOrganizations(userId).stream().map(OrgResponse::from).toList();
	}

	@Operation(summary = "Get an organization by ID")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@GetMapping("/{id}")
	public OrgResponse getById(@PathVariable UUID id) {
		return OrgResponse.from(getOrganizationUseCase.getById(id));
	}

	@Operation(summary = "List members of an organization")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@GetMapping("/{id}/members")
	public List<MemberResponse> getMembers(@PathVariable UUID id) {
		return getOrganizationUseCase.getMembers(id).stream().map(e -> MemberResponse.from(e.member(), e.profile()))
				.toList();
	}

	@Operation(summary = "Update organization visibility and join policy (owner only)")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Settings updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Not the owner"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@PatchMapping("/{id}/settings")
	public OrgResponse updateSettings(@PathVariable UUID id, @Valid @RequestBody UpdateOrgSettingsRequest request,
			@AuthenticationPrincipal UUID userId) {
		Organization org = updateOrganizationSettingsUseCase.execute(id, userId,
				Organization.Visibility.valueOf(request.visibility().toUpperCase()),
				Organization.JoinPolicy.valueOf(request.joinPolicy().toUpperCase()));
		return OrgResponse.from(org);
	}

	@Operation(summary = "Update a member's role in an organization")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Role updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization or member not found")})
	@PatchMapping("/{orgId}/members/{userId}/role")
	public MemberResponse updateRole(@PathVariable UUID orgId, @PathVariable UUID userId,
			@Valid @RequestBody UpdateRoleRequest request) {
		OrganizationMember member = updateMemberRoleUseCase.execute(orgId, userId,
				OrganizationMember.Role.valueOf(request.role().toUpperCase()));
		return MemberResponse.from(member);
	}

	public record UpdateOrgSettingsRequest(@NotBlank String visibility, @NotBlank String joinPolicy) {
	}
}
