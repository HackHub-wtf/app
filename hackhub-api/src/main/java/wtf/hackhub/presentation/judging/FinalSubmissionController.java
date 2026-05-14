package wtf.hackhub.presentation.judging;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.judging.SubmitFinalPresentationUseCase;
import wtf.hackhub.domain.FinalSubmission;
import wtf.hackhub.domain.Team;
import wtf.hackhub.infrastructure.persistence.judging.FinalSubmissionRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Final Submissions", description = "Team final presentation submissions")
@RestController
@RequestMapping("/api/v1/hackathons/{hackathonId}/submissions")
public class FinalSubmissionController {

	private final SubmitFinalPresentationUseCase submitUseCase;
	private final FinalSubmissionRepository submissionRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final TeamRepository teamRepository;

	public FinalSubmissionController(SubmitFinalPresentationUseCase submitUseCase,
			FinalSubmissionRepository submissionRepository, TeamMemberRepository teamMemberRepository,
			TeamRepository teamRepository) {
		this.submitUseCase = submitUseCase;
		this.submissionRepository = submissionRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.teamRepository = teamRepository;
	}

	@Operation(summary = "List all final submissions for a hackathon")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping
	public List<FinalSubmissionResponse> list(@PathVariable UUID hackathonId) {
		return submissionRepository.findAllByHackathonId(hackathonId).stream()
				.map(s -> toResponse(s))
				.toList();
	}

	@Operation(summary = "Create or update the current team's final submission")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Submission saved"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "403", description = "Not team leader or hackathon not running")})
	@PostMapping
	public FinalSubmissionResponse submit(@PathVariable UUID hackathonId,
			@Valid @RequestBody FinalSubmissionRequest req, @AuthenticationPrincipal UUID userId) {
		UUID teamId = resolveTeamId(hackathonId, userId);
		FinalSubmission submission = submitUseCase.execute(hackathonId, teamId, userId, req.ideaId(), req.title(),
				req.description(), req.attachments());
		return toResponse(submission);
	}

	@Operation(summary = "Get the current user's team submission")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Submission found"),
			@ApiResponse(responseCode = "204", description = "No submission yet (no team or no submission)")})
	@GetMapping("/my")
	public org.springframework.http.ResponseEntity<FinalSubmissionResponse> getMy(
			@PathVariable UUID hackathonId, @AuthenticationPrincipal UUID userId) {
		try {
			UUID teamId = resolveTeamId(hackathonId, userId);
			return submissionRepository.findByHackathonIdAndTeamId(hackathonId, teamId)
					.map(s -> org.springframework.http.ResponseEntity.ok(toResponse(s)))
					.orElse(org.springframework.http.ResponseEntity.noContent().build());
		} catch (NotInATeamException e) {
			return org.springframework.http.ResponseEntity.noContent().build();
		}
	}

	private UUID resolveTeamId(UUID hackathonId, UUID userId) {
		return teamMemberRepository.findAllByUserId(userId).stream()
				.filter(tm -> teamRepository.findById(tm.getTeamId())
						.map(t -> hackathonId.equals(t.getHackathonId())).orElse(false))
				.findFirst()
				.map(tm -> tm.getTeamId())
				.orElseThrow(() -> new NotInATeamException(userId, hackathonId));
	}

	private FinalSubmissionResponse toResponse(FinalSubmission s) {
		String teamName = teamRepository.findById(s.getTeamId()).map(Team::getName).orElse(null);
		return new FinalSubmissionResponse(s.getId(), s.getHackathonId(), s.getTeamId(), teamName, s.getIdeaId(),
				s.getTitle(), s.getDescription(), s.getAttachments(), s.getSubmittedBy(), s.getSubmittedAt(),
				s.getUpdatedAt());
	}

	// ── DTOs ─────────────────────────────────────────────────────────────────

	public record FinalSubmissionRequest(UUID ideaId, @NotBlank String title, String description,
			String attachments) {
	}

	public record FinalSubmissionResponse(UUID id, UUID hackathonId, UUID teamId, String teamName, UUID ideaId,
			String title, String description, String attachments, UUID submittedBy, Instant submittedAt,
			Instant updatedAt) {
	}

	public static class SubmissionNotFoundException extends RuntimeException {
		public SubmissionNotFoundException(UUID hackathonId, UUID teamId) {
			super("No submission found for team " + teamId + " in hackathon " + hackathonId);
		}
	}

	public static class NotInATeamException extends RuntimeException {
		public NotInATeamException(UUID userId, UUID hackathonId) {
			super("User " + userId + " is not in any team for hackathon " + hackathonId);
		}
	}
}
