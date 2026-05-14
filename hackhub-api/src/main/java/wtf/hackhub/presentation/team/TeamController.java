package wtf.hackhub.presentation.team;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.team.CreateTeamUseCase;
import wtf.hackhub.application.team.DeleteTeamUseCase;
import wtf.hackhub.application.team.GetTeamsUseCase;
import wtf.hackhub.application.team.JoinTeamUseCase;
import wtf.hackhub.application.team.LeaveTeamUseCase;
import wtf.hackhub.application.team.UpdateTeamUseCase;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Teams", description = "Team creation, membership, and management")
@RestController
public class TeamController {

	private final CreateTeamUseCase createTeamUseCase;
	private final GetTeamsUseCase getTeamsUseCase;
	private final UpdateTeamUseCase updateTeamUseCase;
	private final DeleteTeamUseCase deleteTeamUseCase;
	private final JoinTeamUseCase joinTeamUseCase;
	private final LeaveTeamUseCase leaveTeamUseCase;

	public TeamController(CreateTeamUseCase createTeamUseCase, GetTeamsUseCase getTeamsUseCase,
			UpdateTeamUseCase updateTeamUseCase, DeleteTeamUseCase deleteTeamUseCase, JoinTeamUseCase joinTeamUseCase,
			LeaveTeamUseCase leaveTeamUseCase) {
		this.createTeamUseCase = createTeamUseCase;
		this.getTeamsUseCase = getTeamsUseCase;
		this.updateTeamUseCase = updateTeamUseCase;
		this.deleteTeamUseCase = deleteTeamUseCase;
		this.joinTeamUseCase = joinTeamUseCase;
		this.leaveTeamUseCase = leaveTeamUseCase;
	}

	// ── Nested under hackathons ───────────────────────────────────────────────

	@Operation(summary = "List teams in a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/api/v1/hackathons/{hackathonId}/teams")
	public List<TeamResponse> listByHackathon(@PathVariable UUID hackathonId) {
		return getTeamsUseCase.listByHackathon(hackathonId).stream().map(TeamResponse::from).toList();
	}

	@Operation(summary = "Create a team in a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Team created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/api/v1/hackathons/{hackathonId}/teams")
	@ResponseStatus(HttpStatus.CREATED)
	public TeamResponse create(@PathVariable UUID hackathonId, @Valid @RequestBody CreateTeamRequest req,
			@AuthenticationPrincipal UUID userId) {
		Team team = createTeamUseCase.execute(req.name(), req.description(), hackathonId, userId);
		return TeamResponse.from(team);
	}

	// ── Top-level team routes ─────────────────────────────────────────────────

	@Operation(summary = "Get a team by ID")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@GetMapping("/api/v1/teams/{id}")
	public TeamResponse getById(@PathVariable UUID id) {
		return TeamResponse.from(getTeamsUseCase.getById(id));
	}

	@Operation(summary = "Delete a team")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Deleted"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Not team leader or admin"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@DeleteMapping("/api/v1/teams/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		deleteTeamUseCase.execute(id);
	}

	@Operation(summary = "Update a team's details")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@PutMapping("/api/v1/teams/{id}")
	public TeamResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateTeamRequest req) {
		Team team = updateTeamUseCase.execute(id, req.name(), req.description(), req.isOpen(), req.skills(),
				req.avatarUrl());
		return TeamResponse.from(team);
	}

	@Operation(summary = "Get members of a team")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@GetMapping("/api/v1/teams/{id}/members")
	public List<MemberResponse> getMembers(@PathVariable UUID id) {
		return getTeamsUseCase.getMembers(id).stream().map(MemberResponse::from).toList();
	}

	@Operation(summary = "Join a team")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Joined team"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found"),
			@ApiResponse(responseCode = "409", description = "Already a member or team is full")})
	@PostMapping("/api/v1/teams/{id}/members")
	@ResponseStatus(HttpStatus.CREATED)
	public MemberResponse join(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		return MemberResponse.from(joinTeamUseCase.execute(id, userId));
	}

	@Operation(summary = "Leave a team")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Left team"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@DeleteMapping("/api/v1/teams/{id}/members/me")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leave(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		leaveTeamUseCase.execute(id, userId);
	}

	@Operation(summary = "Remove a member from a team")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Member removed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team or member not found")})
	@DeleteMapping("/api/v1/teams/{teamId}/members/{userId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeMember(@PathVariable UUID teamId, @PathVariable UUID userId) {
		leaveTeamUseCase.execute(teamId, userId);
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record TeamResponse(UUID id, String name, String description, UUID hackathonId, UUID createdBy,
			boolean isOpen, List<String> skills, String avatarUrl, Instant createdAt, Instant updatedAt) {
		static TeamResponse from(Team t) {
			return new TeamResponse(t.getId(), t.getName(), t.getDescription(), t.getHackathonId(), t.getCreatedBy(),
					t.isOpen(), t.getSkills(), t.getAvatarUrl(), t.getCreatedAt(), t.getUpdatedAt());
		}
	}

	public record MemberResponse(UUID id, UUID teamId, UUID userId, String role, Instant joinedAt) {
		static MemberResponse from(TeamMember m) {
			return new MemberResponse(m.getId(), m.getTeamId(), m.getUserId(), m.getRole().toDbValue(),
					m.getJoinedAt());
		}
	}

	public record CreateTeamRequest(@NotBlank @Size(max = 100) String name, @Size(max = 500) String description,
			List<String> skills) {
		public CreateTeamRequest {
			if (description == null)
				description = "";
		}
	}

	public record UpdateTeamRequest(@NotBlank @Size(max = 100) String name, String description, boolean isOpen,
			List<String> skills, String avatarUrl) {
		public UpdateTeamRequest {
			if (skills == null)
				skills = List.of();
			if (description == null)
				description = "";
		}
	}
}
