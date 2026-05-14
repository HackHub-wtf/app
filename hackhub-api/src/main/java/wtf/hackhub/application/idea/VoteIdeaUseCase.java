package wtf.hackhub.application.idea;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaVote;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaVoteRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Toggle vote on an idea (vote/unvote). Replaces the broken ideaService.ts
 * voteIdea() which was disabled due to 406 errors. The votes counter on Idea is
 * maintained by a DB trigger (fn_update_idea_vote_count).
 */
@Service
public class VoteIdeaUseCase {

	private final IdeaRepository ideaRepository;
	private final IdeaVoteRepository voteRepository;

	public VoteIdeaUseCase(IdeaRepository ideaRepository, IdeaVoteRepository voteRepository) {
		this.ideaRepository = ideaRepository;
		this.voteRepository = voteRepository;
	}

	public record Result(boolean voted, long voteCount) {
	}

	@Transactional
	public Result execute(UUID ideaId, UUID userId) {
		Idea idea = ideaRepository.findById(ideaId).orElseThrow(() -> new IdeaNotFoundException(ideaId));

		Optional<IdeaVote> existing = voteRepository.findByIdeaIdAndUserId(ideaId, userId);

		if (existing.isPresent()) {
			// Toggle off
			voteRepository.delete(existing.get());
			long count = voteRepository.countByIdeaId(ideaId);
			return new Result(false, count);
		} else {
			// Toggle on
			voteRepository.save(new IdeaVote(ideaId, userId));
			long count = voteRepository.countByIdeaId(ideaId);
			return new Result(true, count);
		}
	}

	public static class IdeaNotFoundException extends RuntimeException {
		public IdeaNotFoundException(UUID id) {
			super("Idea not found: " + id);
		}
	}
}
