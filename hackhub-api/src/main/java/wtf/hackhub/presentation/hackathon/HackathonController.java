package wtf.hackhub.presentation.hackathon;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import wtf.hackhub.application.hackathon.*;
import wtf.hackhub.application.judging.UpdateHackathonJudgingConfigUseCase;
import wtf.hackhub.domain.Hackathon;

import java.math.BigDecimal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Hackathons", description = "Create and manage hackathons and status transitions")
@RestController
@RequestMapping("/api/v1/hackathons")
public class HackathonController {

	private final CreateHackathonUseCase createHackathonUseCase;
	private final GetHackathonsUseCase getHackathonsUseCase;
	private final UpdateHackathonUseCase updateHackathonUseCase;
	private final JoinHackathonUseCase joinHackathonUseCase;
	private final GetLeaderboardUseCase getLeaderboardUseCase;
	private final UpdateHackathonJudgingConfigUseCase updateJudgingConfigUseCase;

	public HackathonController(CreateHackathonUseCase createHackathonUseCase, GetHackathonsUseCase getHackathonsUseCase,
			UpdateHackathonUseCase updateHackathonUseCase, JoinHackathonUseCase joinHackathonUseCase,
			GetLeaderboardUseCase getLeaderboardUseCase,
			UpdateHackathonJudgingConfigUseCase updateJudgingConfigUseCase) {
		this.createHackathonUseCase = createHackathonUseCase;
		this.getHackathonsUseCase = getHackathonsUseCase;
		this.updateHackathonUseCase = updateHackathonUseCase;
		this.joinHackathonUseCase = joinHackathonUseCase;
		this.getLeaderboardUseCase = getLeaderboardUseCase;
		this.updateJudgingConfigUseCase = updateJudgingConfigUseCase;
	}

	@Operation(summary = "List hackathons. Admin receives all; everyone else receives only hackathons from their orgs.")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping
	public Page<HackathonResponse> list(@RequestParam(required = false) String status, Pageable pageable,
			org.springframework.security.core.Authentication authentication) {
		boolean isAdmin = authentication != null
				&& authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
		if (isAdmin) {
			if (status != null) {
				Hackathon.Status s = Hackathon.Status.valueOf(status.toUpperCase());
				return getHackathonsUseCase.listByStatus(s, pageable).map(HackathonResponse::from);
			}
			return getHackathonsUseCase.listAll(pageable).map(HackathonResponse::from);
		}
		UUID userId = (UUID) authentication.getPrincipal();
		return getHackathonsUseCase.listForUser(userId, pageable).map(HackathonResponse::from);
	}

	@Operation(summary = "Get a hackathon by ID")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "404", description = "Hackathon not found")})
	@GetMapping("/{id}")
	public HackathonResponse getById(@PathVariable UUID id) {
		return HackathonResponse.from(getHackathonsUseCase.getById(id));
	}

	@Operation(summary = "Create a new hackathon")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Hackathon created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and (#req.organizationId == null or @orgSecurity.isOrgOwnerOrManager(#req.organizationId, authentication)))")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public HackathonResponse create(@Valid @RequestBody CreateHackathonRequest req,
			@AuthenticationPrincipal UUID userId) {
		Hackathon h = createHackathonUseCase.execute(new CreateHackathonUseCase.Command(req.title(), req.description(),
				req.startDate(), req.endDate(), req.maxTeamSize(), req.allowedParticipants(), userId,
				req.organizationId(), req.tags(), req.prizes()));
		return HackathonResponse.from(h);
	}

	@Operation(summary = "Update a hackathon's details")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role"),
			@ApiResponse(responseCode = "404", description = "Hackathon not found")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#id, authentication))")
	@PutMapping("/{id}")
	public HackathonResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateHackathonRequest req) {
		Hackathon h = updateHackathonUseCase.execute(new UpdateHackathonUseCase.Command(id, req.title(),
				req.description(), req.startDate(), req.endDate(), req.maxTeamSize(), req.allowedParticipants(),
				req.rules(), req.bannerUrl(), req.prizes(), req.tags()));
		return HackathonResponse.from(h);
	}

	@Operation(summary = "Transition a hackathon to a new status")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Status updated"),
			@ApiResponse(responseCode = "400", description = "Invalid status transition"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role"),
			@ApiResponse(responseCode = "404", description = "Hackathon not found")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#id, authentication))")
	@PatchMapping("/{id}/status")
	public HackathonResponse transitionStatus(@PathVariable UUID id, @RequestBody StatusTransitionRequest req) {
		Hackathon h = updateHackathonUseCase.transitionStatus(id, Hackathon.Status.valueOf(req.status().toUpperCase()));
		return HackathonResponse.from(h);
	}

	@Operation(summary = "Get leaderboard for a hackathon — ideas ranked by weighted score")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping("/{hackathonId}/leaderboard")
	public List<LeaderboardResponse> leaderboard(@PathVariable UUID hackathonId) {
		return getLeaderboardUseCase.execute(hackathonId).stream().map(LeaderboardResponse::from).toList();
	}

	@Operation(summary = "Update judging configuration for a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Config updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role"),
			@ApiResponse(responseCode = "404", description = "Hackathon not found")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#id, authentication))")
	@PatchMapping("/{id}/config")
	public HackathonResponse updateConfig(@PathVariable UUID id, @RequestBody JudgingConfigRequest req) {
		Hackathon h = updateJudgingConfigUseCase.executePartial(id,
				req.visibility() != null ? Hackathon.Visibility.valueOf(req.visibility().toUpperCase()) : null,
				req.joinPolicy() != null ? Hackathon.JoinPolicy.valueOf(req.joinPolicy().toUpperCase()) : null,
				req.judgingMode() != null ? Hackathon.JudgingMode.valueOf(req.judgingMode().toUpperCase()) : null,
				req.panelWeight());
		return HackathonResponse.from(h);
	}

	@Operation(summary = "Join a hackathon using its registration key")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Joined successfully"),
			@ApiResponse(responseCode = "400", description = "Invalid or expired registration key"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/join")
	public HackathonResponse join(@RequestBody JoinRequest req) {
		return HackathonResponse.from(joinHackathonUseCase.execute(req.registrationKey()));
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record HackathonResponse(UUID id, String title, String description, Instant startDate, Instant endDate,
			String registrationKey, String status, int maxTeamSize, int allowedParticipants, int currentParticipants,
			UUID createdBy, UUID organizationId, String bannerUrl, String rules, List<String> prizes, List<String> tags,
			String visibility, String joinPolicy, String judgingMode, int panelWeight, Instant createdAt,
			Instant updatedAt) {
		static HackathonResponse from(Hackathon h) {
			return new HackathonResponse(h.getId(), h.getTitle(), h.getDescription(), h.getStartDate(), h.getEndDate(),
					h.getRegistrationKey(), h.getStatus().toDbValue(), h.getMaxTeamSize(), h.getAllowedParticipants(),
					h.getCurrentParticipants(), h.getCreatedBy(), h.getOrganizationId(), h.getBannerUrl(), h.getRules(),
					h.getPrizes(), h.getTags(), h.getVisibility().toDbValue(), h.getJoinPolicy().toDbValue(),
					h.getJudgingMode().toDbValue(), h.getPanelWeight(), h.getCreatedAt(), h.getUpdatedAt());
		}
	}

	public record CreateHackathonRequest(@NotBlank @Size(max = 200) String title, @NotBlank String description,
			@NotNull Instant startDate, @NotNull Instant endDate, @Min(2) @Max(20) int maxTeamSize,
			@Min(1) int allowedParticipants, UUID organizationId, List<String> tags, List<String> prizes) {
	}

	public record UpdateHackathonRequest(@NotBlank @Size(max = 200) String title, @NotBlank String description,
			@NotNull Instant startDate, @NotNull Instant endDate, @Min(2) @Max(20) int maxTeamSize,
			@Min(1) int allowedParticipants, String rules, String bannerUrl, List<String> prizes, List<String> tags) {
	}

	public record StatusTransitionRequest(@NotBlank String status) {
	}
	public record JoinRequest(@NotBlank String registrationKey) {
	}

	public record JudgingConfigRequest(String visibility, String joinPolicy, String judgingMode, Integer panelWeight) {
	}

	public record LeaderboardResponse(int rank, UUID ideaId, String title, String description, UUID teamId,
			String teamName, BigDecimal totalScore, int voteCount, List<CriteriaScoreResponse> criteriaScores) {

		static LeaderboardResponse from(GetLeaderboardUseCase.LeaderboardEntry e) {
			List<CriteriaScoreResponse> cs = e.criteriaScores().stream()
					.map(c -> new CriteriaScoreResponse(c.criteriaId(), c.criteriaName(), c.weight(), c.averageScore()))
					.toList();
			return new LeaderboardResponse(e.rank(), e.ideaId(), e.title(), e.description(), e.teamId(), e.teamName(),
					e.totalScore(), e.voteCount(), cs);
		}
	}

	public record CriteriaScoreResponse(UUID criteriaId, String criteriaName, int weight, BigDecimal averageScore) {
	}
}
