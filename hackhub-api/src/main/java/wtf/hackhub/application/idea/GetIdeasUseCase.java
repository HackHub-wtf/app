package wtf.hackhub.application.idea;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;

import java.util.UUID;

@Service
public class GetIdeasUseCase {

	private final IdeaRepository ideaRepository;

	public GetIdeasUseCase(IdeaRepository ideaRepository) {
		this.ideaRepository = ideaRepository;
	}

	@Transactional(readOnly = true)
	public Page<Idea> listByHackathon(UUID hackathonId, Pageable pageable) {
		return ideaRepository.findByHackathonIdOrderByCreatedAtDesc(hackathonId, pageable);
	}

	@Transactional(readOnly = true)
	public Idea getById(UUID id) {
		return ideaRepository.findById(id).orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(id));
	}
}
