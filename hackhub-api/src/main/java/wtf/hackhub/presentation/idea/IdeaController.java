package wtf.hackhub.presentation.idea;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.idea.*;
import wtf.hackhub.domain.Comment;
import wtf.hackhub.domain.Idea;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Ideas", description = "Idea CRUD, voting, comments, and scoring")
@RestController
public class IdeaController {

	private final SubmitIdeaUseCase submitIdeaUseCase;
	private final GetIdeasUseCase getIdeasUseCase;
	private final VoteIdeaUseCase voteIdeaUseCase;
	private final CommentUseCase commentUseCase;
	private final ScoreIdeaUseCase scoreIdeaUseCase;

	public IdeaController(SubmitIdeaUseCase submitIdeaUseCase, GetIdeasUseCase getIdeasUseCase,
			VoteIdeaUseCase voteIdeaUseCase, CommentUseCase commentUseCase, ScoreIdeaUseCase scoreIdeaUseCase) {
		this.submitIdeaUseCase = submitIdeaUseCase;
		this.getIdeasUseCase = getIdeasUseCase;
		this.voteIdeaUseCase = voteIdeaUseCase;
		this.commentUseCase = commentUseCase;
		this.scoreIdeaUseCase = scoreIdeaUseCase;
	}

	@Operation(summary = "List ideas for a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/api/v1/hackathons/{hackathonId}/ideas")
	public Page<IdeaResponse> listByHackathon(@PathVariable UUID hackathonId, Pageable pageable) {
		return getIdeasUseCase.listByHackathon(hackathonId, pageable).map(IdeaResponse::from);
	}

	@Operation(summary = "Submit a new idea to a hackathon")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Idea submitted"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/api/v1/hackathons/{hackathonId}/ideas")
	@ResponseStatus(HttpStatus.CREATED)
	public IdeaResponse create(@PathVariable UUID hackathonId, @Valid @RequestBody CreateIdeaRequest req,
			@AuthenticationPrincipal UUID userId) {
		return IdeaResponse.from(submitIdeaUseCase.execute(req.title(), req.description(), hackathonId, req.teamId(),
				userId, req.category(), req.tags()));
	}

	@Operation(summary = "Get an idea by ID")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@GetMapping("/api/v1/ideas/{id}")
	public IdeaResponse getById(@PathVariable UUID id) {
		return IdeaResponse.from(getIdeasUseCase.getById(id));
	}

	@Operation(summary = "Update an existing idea")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@PutMapping("/api/v1/ideas/{id}")
	public IdeaResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateIdeaRequest req,
			@AuthenticationPrincipal UUID userId) {
		Idea idea = submitIdeaUseCase.update(id, userId, req.title(), req.description(), req.category(), req.tags(),
				req.status() != null ? Idea.Status.valueOf(req.status().toUpperCase().replace("-", "_")) : null,
				req.repositoryUrl(), req.demoUrl(), req.projectAttachments());
		return IdeaResponse.from(idea);
	}

	@Operation(summary = "Delete an idea")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Deleted"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@DeleteMapping("/api/v1/ideas/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		submitIdeaUseCase.delete(id, userId);
	}

	@Operation(summary = "Toggle a vote on an idea")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Vote toggled"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@PostMapping("/api/v1/ideas/{id}/votes")
	public VoteResponse vote(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		VoteIdeaUseCase.Result result = voteIdeaUseCase.execute(id, userId);
		return new VoteResponse(result.voted(), result.voteCount());
	}

	@Operation(summary = "List comments on an idea")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@GetMapping("/api/v1/ideas/{id}/comments")
	public List<CommentResponse> listComments(@PathVariable UUID id) {
		return commentUseCase.listForIdea(id).stream().map(CommentResponse::from).toList();
	}

	@Operation(summary = "Add a comment to an idea")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Comment added"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea not found")})
	@PostMapping("/api/v1/ideas/{id}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public CommentResponse addComment(@PathVariable UUID id, @Valid @RequestBody AddCommentRequest req,
			@AuthenticationPrincipal UUID userId) {
		return CommentResponse.from(commentUseCase.add(id, userId, req.content()));
	}

	@Operation(summary = "Submit a judge score for an idea")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Score recorded"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Idea or criteria not found")})
	@PostMapping("/api/v1/ideas/{id}/scores")
	public ScoreResponse score(@PathVariable UUID id, @Valid @RequestBody ScoreRequest req,
			@AuthenticationPrincipal UUID userId) {
		var s = scoreIdeaUseCase.execute(id, userId, req.criteriaId(), req.score());
		return new ScoreResponse(s.getId(), s.getIdeaId(), s.getUserId(), s.getCriteriaId(), s.getScore());
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record IdeaResponse(UUID id, String title, String description, UUID hackathonId, UUID teamId, UUID createdBy,
			String category, List<String> tags, int votes, String status, List<String> attachments,
			String repositoryUrl, String demoUrl, String projectAttachments, BigDecimal totalScore, int voteCount,
			Instant createdAt, Instant updatedAt) {
		static IdeaResponse from(Idea i) {
			return new IdeaResponse(i.getId(), i.getTitle(), i.getDescription(), i.getHackathonId(), i.getTeamId(),
					i.getCreatedBy(), i.getCategory(), i.getTags(), i.getVotes(), i.getStatus().toDbValue(),
					i.getAttachments(), i.getRepositoryUrl(), i.getDemoUrl(), i.getProjectAttachments(),
					i.getTotalScore(), i.getVoteCount(), i.getCreatedAt(), i.getUpdatedAt());
		}
	}

	public record CommentResponse(UUID id, UUID ideaId, UUID userId, String content, Instant createdAt,
			Instant updatedAt) {
		static CommentResponse from(Comment c) {
			return new CommentResponse(c.getId(), c.getIdeaId(), c.getUserId(), c.getContent(), c.getCreatedAt(),
					c.getUpdatedAt());
		}
	}

	public record VoteResponse(boolean voted, long voteCount) {
	}
	public record ScoreResponse(UUID id, UUID ideaId, UUID userId, UUID criteriaId, int score) {
	}

	public record CreateIdeaRequest(@NotBlank String title, @NotBlank String description, UUID teamId,
			@NotBlank String category, List<String> tags) {
	}

	public record UpdateIdeaRequest(@NotBlank String title, @NotBlank String description, @NotBlank String category,
			List<String> tags, String status, String repositoryUrl, String demoUrl, String projectAttachments) {
		public UpdateIdeaRequest {
			if (tags == null)
				tags = List.of();
		}
	}

	public record AddCommentRequest(@NotBlank String content) {
	}

	public record ScoreRequest(UUID criteriaId, int score) {
	}
}
