package wtf.hackhub.application.team;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.UUID;

@Service
public class CreateTeamUseCase {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final HackathonRepository hackathonRepository;

	public CreateTeamUseCase(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository,
			HackathonRepository hackathonRepository) {
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.hackathonRepository = hackathonRepository;
	}

	/**
	 * Atomically creates a team AND adds the creator as leader. Fixes the atomicity
	 * bug in the original teamService.ts where createTeam() and addTeamMember()
	 * were separate non-transactional calls.
	 */
	@Transactional
	public Team execute(String name, String description, UUID hackathonId, UUID createdByUserId) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonForTeamNotFoundException(hackathonId));

		if (hackathon.getStatus() == Hackathon.Status.DRAFT || hackathon.getStatus() == Hackathon.Status.COMPLETED) {
			throw new HackathonNotAcceptingTeamsException(hackathonId, hackathon.getStatus());
		}

		if (teamRepository.existsByNameAndHackathonId(name, hackathonId)) {
			throw new TeamNameTakenException(name, hackathonId);
		}

		// Enforce one team per hackathon per user
		if (teamMemberRepository.existsByHackathonIdAndUserId(hackathonId, createdByUserId)) {
			throw new JoinTeamUseCase.AlreadyOnTeamInHackathonException(createdByUserId, hackathonId);
		}

		// Save team first, then leader — both in same transaction
		Team team = teamRepository.save(new Team(name, description, hackathonId, createdByUserId));
		teamMemberRepository.save(new TeamMember(team.getId(), createdByUserId, TeamMember.Role.LEADER));

		return team;
	}

	public static class HackathonForTeamNotFoundException extends RuntimeException {
		public HackathonForTeamNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}

	public static class HackathonNotAcceptingTeamsException extends RuntimeException {
		public HackathonNotAcceptingTeamsException(UUID id, Hackathon.Status status) {
			super("Hackathon " + id + " is not accepting teams (status: " + status + ")");
		}
	}

	public static class TeamNameTakenException extends RuntimeException {
		public TeamNameTakenException(String name, UUID hackathonId) {
			super("Team name '" + name + "' already taken in hackathon " + hackathonId);
		}
	}
}
