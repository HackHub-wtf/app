package wtf.hackhub.application.idea;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.UUID;

@Service
public class SubmitIdeaUseCase {

	private final IdeaRepository ideaRepository;
	private final HackathonRepository hackathonRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final OrganizationMemberRepository orgMemberRepository;

	public SubmitIdeaUseCase(IdeaRepository ideaRepository, HackathonRepository hackathonRepository,
			TeamRepository teamRepository, TeamMemberRepository teamMemberRepository,
			OrganizationMemberRepository orgMemberRepository) {
		this.ideaRepository = ideaRepository;
		this.hackathonRepository = hackathonRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.orgMemberRepository = orgMemberRepository;
	}

	@Transactional
	public Idea execute(String title, String description, UUID hackathonId, UUID teamId, UUID createdBy,
			String category, List<String> tags) {

		// Validate hackathon exists
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new IdeaHackathonNotFoundException(hackathonId));

		// Validate team belongs to the hackathon
		var team = teamRepository.findById(teamId)
				.orElseThrow(() -> new IdeaTeamNotFoundException(teamId));
		if (!team.getHackathonId().equals(hackathonId)) {
			throw new IdeaTeamHackathonMismatchException(teamId, hackathonId);
		}

		// Validate user belongs to the team
		if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, createdBy)) {
			throw new IdeaAccessDeniedException(null, createdBy);
		}

		// Validate user is org member (if hackathon has an org)
		if (hackathon.getOrganizationId() != null
				&& !orgMemberRepository.existsByOrganizationIdAndUserId(hackathon.getOrganizationId(), createdBy)) {
			throw new IdeaAccessDeniedException(null, createdBy);
		}

		Idea idea = new Idea(title, description, hackathonId, teamId, createdBy, category);
		if (tags != null) {
			idea.update(title, description, category, tags, Idea.Status.DRAFT, null, null, null);
		}
		return ideaRepository.save(idea);
	}

	@Transactional
	public Idea update(UUID ideaId, UUID requestingUserId, String title, String description, String category,
			List<String> tags, Idea.Status status, String repositoryUrl, String demoUrl, String projectAttachments) {
		Idea idea = ideaRepository.findById(ideaId)
				.orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(ideaId));
		if (!idea.getCreatedBy().equals(requestingUserId)) {
			throw new IdeaAccessDeniedException(ideaId, requestingUserId);
		}
		Idea.Status resolvedStatus = status != null ? status : idea.getStatus();
		idea.update(title, description, category, tags, resolvedStatus, repositoryUrl, demoUrl, projectAttachments);
		return ideaRepository.save(idea);
	}

	@Transactional
	public void delete(UUID ideaId, UUID requestingUserId) {
		Idea idea = ideaRepository.findById(ideaId)
				.orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(ideaId));
		if (!idea.getCreatedBy().equals(requestingUserId)) {
			throw new IdeaAccessDeniedException(ideaId, requestingUserId);
		}
		ideaRepository.delete(idea);
	}

	public static class IdeaAccessDeniedException extends RuntimeException {
		public IdeaAccessDeniedException(UUID id, UUID userId) {
			super("User " + userId + " does not have permission to submit or edit idea " + id);
		}
	}
	public static class IdeaHackathonNotFoundException extends RuntimeException {
		public IdeaHackathonNotFoundException(UUID id) { super("Hackathon not found: " + id); }
	}
	public static class IdeaTeamNotFoundException extends RuntimeException {
		public IdeaTeamNotFoundException(UUID id) { super("Team not found: " + id); }
	}
	public static class IdeaTeamHackathonMismatchException extends RuntimeException {
		public IdeaTeamHackathonMismatchException(UUID teamId, UUID hackathonId) {
			super("Team " + teamId + " does not belong to hackathon " + hackathonId);
		}
	}
}
