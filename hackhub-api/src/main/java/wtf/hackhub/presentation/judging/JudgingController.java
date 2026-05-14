package wtf.hackhub.presentation.judging;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.judging.*;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Judging", description = "Judge management and panel scoring")
@RestController
@RequestMapping("/api/v1/hackathons/{hackathonId}/judging")
public class JudgingController {

	private final InviteJudgeUseCase inviteJudgeUseCase;
	private final RemoveJudgeUseCase removeJudgeUseCase;
	private final GetHackathonJudgesUseCase getJudgesUseCase;
	private final SubmitJudgeScoreUseCase submitScoreUseCase;
	private final GetJudgeScoresUseCase getScoresUseCase;
	private final HackathonRepository hackathonRepository;
	private final OrganizationMemberRepository memberRepository;

	public JudgingController(InviteJudgeUseCase inviteJudgeUseCase, RemoveJudgeUseCase removeJudgeUseCase,
			GetHackathonJudgesUseCase getJudgesUseCase, SubmitJudgeScoreUseCase submitScoreUseCase,
			GetJudgeScoresUseCase getScoresUseCase, HackathonRepository hackathonRepository,
			OrganizationMemberRepository memberRepository) {
		this.inviteJudgeUseCase = inviteJudgeUseCase;
		this.removeJudgeUseCase = removeJudgeUseCase;
		this.getJudgesUseCase = getJudgesUseCase;
		this.submitScoreUseCase = submitScoreUseCase;
		this.getScoresUseCase = getScoresUseCase;
		this.hackathonRepository = hackathonRepository;
		this.memberRepository = memberRepository;
	}

	@Operation(summary = "List all judges for a hackathon")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping("/judges")
	public List<JudgeResponse> listJudges(@PathVariable UUID hackathonId) {
		return getJudgesUseCase.execute(hackathonId).stream()
				.map(e -> new JudgeResponse(e.id(), e.hackathonId(), e.userId(), e.name(), e.email(), e.invitedBy(),
						e.invitedAt()))
				.toList();
	}

	@Operation(summary = "Invite a user as judge for a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Judge invited"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "403", description = "Not authorized to invite")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication))")
	@PostMapping("/judges")
	@ResponseStatus(HttpStatus.CREATED)
	public JudgeResponse inviteJudge(@PathVariable UUID hackathonId, @Valid @RequestBody InviteJudgeRequest req,
			@AuthenticationPrincipal UUID userId) {
		var judge = inviteJudgeUseCase.execute(hackathonId, req.userId(), userId);
		return new JudgeResponse(judge.getId(), judge.getHackathonId(), judge.getUserId(), null, null,
				judge.getInvitedBy(), judge.getInvitedAt());
	}

	@Operation(summary = "Remove a judge from a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Judge removed"),
			@ApiResponse(responseCode = "403", description = "Insufficient role"),
			@ApiResponse(responseCode = "404", description = "Judge not found")})
	@PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication))")
	@DeleteMapping("/judges/{targetUserId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeJudge(@PathVariable UUID hackathonId, @PathVariable UUID targetUserId) {
		removeJudgeUseCase.execute(hackathonId, targetUserId);
	}

	@Operation(summary = "Submit or update a judge score for an idea")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Score recorded"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "403", description = "Not a judge for this hackathon")})
	@PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @hackathonSecurity.isJudgeOrOrgManager(#hackathonId, authentication)")
	@PostMapping("/scores")
	public ScoreResponse submitScore(@PathVariable UUID hackathonId, @Valid @RequestBody SubmitScoreRequest req,
			@AuthenticationPrincipal UUID userId) {
		JudgeScore score = submitScoreUseCase.execute(hackathonId, req.ideaId(), userId, req.criterionId(),
				req.score(), req.comment());
		return ScoreResponse.from(score);
	}

	@Operation(summary = "Get scores for a hackathon — judges see their own, managers see all")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping("/scores")
	public List<ScoreResponse> getScores(@PathVariable UUID hackathonId, @AuthenticationPrincipal UUID userId) {
		boolean isManager = isManagerOrOwner(hackathonId, userId);
		return getScoresUseCase.getScoresForHackathon(hackathonId, userId, isManager).stream()
				.map(ScoreResponse::from).toList();
	}

	@Operation(summary = "Get blended score summary per idea (leaderboard view)")
	@ApiResponse(responseCode = "200", description = "Success")
	@GetMapping("/scores/summary")
	public List<ScoreSummaryResponse> getSummary(@PathVariable UUID hackathonId) {
		return getScoresUseCase.getSummary(hackathonId).stream()
				.map(s -> new ScoreSummaryResponse(s.ideaId(), s.ideaTitle(), s.panelScore(), s.communityScore(),
						s.blendedScore(), s.rank()))
				.toList();
	}

	private boolean isManagerOrOwner(UUID hackathonId, UUID userId) {
		return hackathonRepository.findById(hackathonId).map(h -> {
			if (h.getOrganizationId() == null) return false;
			return memberRepository.findByOrganizationIdAndUserId(h.getOrganizationId(), userId)
					.map(m -> m.getRole() == wtf.hackhub.domain.OrganizationMember.Role.OWNER
							|| m.getRole() == wtf.hackhub.domain.OrganizationMember.Role.MANAGER)
					.orElse(false);
		}).orElse(false);
	}

	// ── DTOs ─────────────────────────────────────────────────────────────────

	public record InviteJudgeRequest(@NotNull UUID userId) {
	}

	public record SubmitScoreRequest(@NotNull UUID ideaId, UUID criterionId,
			@Min(1) @Max(10) int score, String comment) {
	}

	public record JudgeResponse(UUID id, UUID hackathonId, UUID userId, String name, String email,
			UUID invitedBy, Instant invitedAt) {
	}

	public record ScoreResponse(UUID id, UUID hackathonId, UUID ideaId, UUID judgeId, UUID criterionId,
			int score, String comment, Instant createdAt) {
		static ScoreResponse from(JudgeScore s) {
			return new ScoreResponse(s.getId(), s.getHackathonId(), s.getIdeaId(), s.getJudgeId(),
					s.getCriterionId(), s.getScore(), s.getComment(), s.getCreatedAt());
		}
	}

	public record ScoreSummaryResponse(UUID ideaId, String ideaTitle, BigDecimal panelScore,
			BigDecimal communityScore, BigDecimal blendedScore, int rank) {
	}
}
