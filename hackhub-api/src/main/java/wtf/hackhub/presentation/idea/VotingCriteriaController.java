package wtf.hackhub.presentation.idea;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.idea.ManageVotingCriteriaUseCase;
import wtf.hackhub.domain.VotingCriteria;

import java.util.List;
import java.util.UUID;

@Tag(name = "Voting Criteria", description = "Weighted scoring criteria per hackathon")
@RestController
@RequestMapping("/api/v1/hackathons/{hackathonId}/voting-criteria")
public class VotingCriteriaController {

	private final ManageVotingCriteriaUseCase useCase;

	public VotingCriteriaController(ManageVotingCriteriaUseCase useCase) {
		this.useCase = useCase;
	}

	@Operation(summary = "List voting criteria for a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping
	public List<CriteriaResponse> list(@PathVariable UUID hackathonId) {
		return useCase.listForHackathon(hackathonId).stream().map(CriteriaResponse::from).toList();
	}

	@Operation(summary = "Create a voting criterion for a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Criterion created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication))")
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CriteriaResponse create(@PathVariable UUID hackathonId, @Valid @RequestBody CreateCriteriaRequest req) {
		VotingCriteria c = useCase.create(hackathonId, req.name(), req.description(), req.weight(), req.displayOrder());
		return CriteriaResponse.from(c);
	}

	@Operation(summary = "Delete a voting criterion")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Deleted"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "403", description = "Insufficient role"),
			@ApiResponse(responseCode = "404", description = "Criterion not found")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication))")
	@DeleteMapping("/{criteriaId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID hackathonId, @PathVariable UUID criteriaId) {
		useCase.delete(hackathonId, criteriaId);
	}

	public record CriteriaResponse(UUID id, UUID hackathonId, String name, String description, int weight,
			int displayOrder) {
		static CriteriaResponse from(VotingCriteria c) {
			return new CriteriaResponse(c.getId(), c.getHackathonId(), c.getName(), c.getDescription(), c.getWeight(),
					c.getDisplayOrder());
		}
	}

	public record CreateCriteriaRequest(@NotBlank @Size(max = 100) String name, String description,
			@Min(1) @Max(100) int weight, @Min(0) int displayOrder) {
	}
}
