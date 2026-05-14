package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.FinalSubmission;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.judging.FinalSubmissionRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.UUID;

@Service
public class SubmitFinalPresentationUseCase {

	private final FinalSubmissionRepository submissionRepository;
	private final HackathonRepository hackathonRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final TeamRepository teamRepository;

	public SubmitFinalPresentationUseCase(FinalSubmissionRepository submissionRepository,
			HackathonRepository hackathonRepository, TeamMemberRepository teamMemberRepository,
			TeamRepository teamRepository) {
		this.submissionRepository = submissionRepository;
		this.hackathonRepository = hackathonRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.teamRepository = teamRepository;
	}

	@Transactional
	public FinalSubmission execute(UUID hackathonId, UUID teamId, UUID userId, UUID ideaId, String title,
			String description, String attachmentsJson) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonNotFoundException(hackathonId));

		if (hackathon.getStatus() != Hackathon.Status.RUNNING) {
			throw new HackathonNotRunningException(hackathonId);
		}

		teamRepository.findById(teamId).orElseThrow(() -> new TeamNotFoundException(teamId));

		TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new NotTeamMemberException(userId, teamId));

		if (member.getRole() != TeamMember.Role.LEADER) {
			throw new NotTeamLeaderException(userId, teamId);
		}

		return submissionRepository.findByHackathonIdAndTeamId(hackathonId, teamId).map(existing -> {
			existing.update(ideaId, title, description, attachmentsJson);
			return submissionRepository.save(existing);
		}).orElseGet(() -> submissionRepository
				.save(new FinalSubmission(hackathonId, teamId, ideaId, title, description, attachmentsJson, userId)));
	}

	public static class HackathonNotFoundException extends RuntimeException {
		public HackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}

	public static class HackathonNotRunningException extends RuntimeException {
		public HackathonNotRunningException(UUID id) {
			super("Hackathon " + id + " is not in running status");
		}
	}

	public static class TeamNotFoundException extends RuntimeException {
		public TeamNotFoundException(UUID id) {
			super("Team not found: " + id);
		}
	}

	public static class NotTeamMemberException extends RuntimeException {
		public NotTeamMemberException(UUID userId, UUID teamId) {
			super("User " + userId + " is not a member of team " + teamId);
		}
	}

	public static class NotTeamLeaderException extends RuntimeException {
		public NotTeamLeaderException(UUID userId, UUID teamId) {
			super("User " + userId + " is not the leader of team " + teamId);
		}
	}
}
