package wtf.hackhub.presentation.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import wtf.hackhub.application.admin.AdminCreateUserUseCase;
import wtf.hackhub.application.admin.ListUsersUseCase;
import wtf.hackhub.application.admin.UpdateUserRoleUseCase;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Admin", description = "Platform administration — user and organization management")
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

	private final ListUsersUseCase listUsersUseCase;
	private final UpdateUserRoleUseCase updateUserRoleUseCase;
	private final AdminCreateUserUseCase adminCreateUserUseCase;
	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;
	private final HackathonRepository hackathonRepository;

	public AdminController(ListUsersUseCase listUsersUseCase, UpdateUserRoleUseCase updateUserRoleUseCase,
			AdminCreateUserUseCase adminCreateUserUseCase, OrganizationRepository organizationRepository,
			OrganizationMemberRepository memberRepository, HackathonRepository hackathonRepository) {
		this.listUsersUseCase = listUsersUseCase;
		this.updateUserRoleUseCase = updateUserRoleUseCase;
		this.adminCreateUserUseCase = adminCreateUserUseCase;
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
		this.hackathonRepository = hackathonRepository;
	}

	@Operation(summary = "List all platform users")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/users")
	public Page<UserSummary> listUsers(Pageable pageable) {
		return listUsersUseCase.execute(pageable).map(UserSummary::from);
	}

	@Operation(summary = "Create a new platform user (admin or manager)")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "User created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient permissions"),
			@ApiResponse(responseCode = "409", description = "Email already registered")})
	@PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
	@PostMapping("/users")
	public ResponseEntity<UserSummary> createUser(@Valid @RequestBody AdminCreateUserRequest req,
			@AuthenticationPrincipal UUID callerId) {
		boolean callerIsManager = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
				.contains(new SimpleGrantedAuthority("ROLE_MANAGER"))
				&& !SecurityContextHolder.getContext().getAuthentication().getAuthorities()
						.contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
		Profile.Role role = req.role() != null ? req.role() : Profile.Role.PARTICIPANT;
		Profile created = adminCreateUserUseCase.execute(req.email(), req.name(), req.password(), role,
				req.organizationId(), callerId, callerIsManager);
		return ResponseEntity.status(HttpStatus.CREATED).body(UserSummary.from(created));
	}

	@Operation(summary = "Update a user's platform role")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Role updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "User not found")})
	@PatchMapping("/users/{id}/role")
	public UserSummary updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateRoleRequest request) {
		Profile updated = updateUserRoleUseCase.execute(id, Profile.Role.fromDbValue(request.role()));
		return UserSummary.from(updated);
	}

	@Operation(summary = "List all organizations")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/organizations")
	public Page<OrgSummary> listOrganizations(Pageable pageable) {
		return organizationRepository.findAll(pageable).map(org -> toOrgSummary(org));
	}

	@Operation(summary = "Update an organization's details")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@PatchMapping("/organizations/{id}")
	public OrgSummary updateOrganization(@PathVariable UUID id, @Valid @RequestBody UpdateOrgRequest request) {
		Organization org = organizationRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		org.update(request.name(), request.description(), null, request.websiteUrl());
		return toOrgSummary(organizationRepository.save(org));
	}

	@Operation(summary = "Delete an organization")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Deleted"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Organization not found")})
	@DeleteMapping("/organizations/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteOrganization(@PathVariable UUID id) {
		if (!organizationRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		organizationRepository.deleteById(id);
	}

	// ── helpers ───────────────────────────────────────────────────────────────

	private OrgSummary toOrgSummary(Organization org) {
		long memberCount = memberRepository.countByOrganizationId(org.getId());
		long hackathonCount = hackathonRepository.countByOrganizationId(org.getId());
		return new OrgSummary(org.getId(), org.getName(), org.getSlug(), org.getDescription(), org.getWebsiteUrl(),
				org.getCreatedBy(), memberCount, hackathonCount, org.getCreatedAt());
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record UserSummary(UUID id, String email, String name, String role, Instant createdAt) {
		static UserSummary from(Profile p) {
			return new UserSummary(p.getId(), p.getEmail(), p.getName(), p.getRole().toDbValue(), p.getCreatedAt());
		}
	}

	public record OrgSummary(UUID id, String name, String slug, String description, String websiteUrl, UUID createdBy,
			long memberCount, long hackathonCount, Instant createdAt) {
	}

	public record UpdateRoleRequest(@NotBlank @Pattern(regexp = "admin|manager|participant") String role) {
	}

	public record UpdateOrgRequest(@NotBlank String name, String description, String websiteUrl) {
	}
}
