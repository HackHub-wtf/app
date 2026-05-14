package wtf.hackhub.application.team;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.UUID;

@Service
public class JoinTeamUseCase {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final HackathonRepository hackathonRepository;
	private final OrganizationMemberRepository orgMemberRepository;

	public JoinTeamUseCase(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository,
			HackathonRepository hackathonRepository, OrganizationMemberRepository orgMemberRepository) {
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.hackathonRepository = hackathonRepository;
		this.orgMemberRepository = orgMemberRepository;
	}

	@Transactional
	public TeamMember execute(UUID teamId, UUID userId) {
		Team team = teamRepository.findById(teamId).orElseThrow(() -> new TeamNotFoundException(teamId));

		if (!team.isOpen()) {
			throw new TeamClosedException(teamId);
		}

		if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
			throw new AlreadyMemberException(userId, teamId);
		}

		// Enforce one team per hackathon per user
		if (teamMemberRepository.existsByHackathonIdAndUserId(team.getHackathonId(), userId)) {
			throw new AlreadyOnTeamInHackathonException(userId, team.getHackathonId());
		}

		// Validate user is org member (if hackathon has an org)
		hackathonRepository.findById(team.getHackathonId()).ifPresent(h -> {
			if (h.getOrganizationId() != null
					&& !orgMemberRepository.existsByOrganizationIdAndUserId(h.getOrganizationId(), userId)) {
				throw new NotOrgMemberException(userId, h.getOrganizationId());
			}
		});

		// Enforce hackathon max team size
		hackathonRepository.findById(team.getHackathonId()).ifPresent(h -> {
			long currentSize = teamMemberRepository.findAllByTeamId(teamId).size();
			if (currentSize >= h.getMaxTeamSize()) {
				throw new TeamFullException(teamId, h.getMaxTeamSize());
			}
		});

		return teamMemberRepository.save(new TeamMember(teamId, userId, TeamMember.Role.MEMBER));
	}

	public static class TeamNotFoundException extends RuntimeException {
		public TeamNotFoundException(UUID id) {
			super("Team not found: " + id);
		}
	}
	public static class TeamClosedException extends RuntimeException {
		public TeamClosedException(UUID id) {
			super("Team " + id + " is not accepting members");
		}
	}
	public static class AlreadyMemberException extends RuntimeException {
		public AlreadyMemberException(UUID userId, UUID teamId) {
			super("User " + userId + " is already a member of team " + teamId);
		}
	}
	public static class TeamFullException extends RuntimeException {
		public TeamFullException(UUID teamId, int maxSize) {
			super("Team " + teamId + " is full (max " + maxSize + " members)");
		}
	}
	public static class AlreadyOnTeamInHackathonException extends RuntimeException {
		public AlreadyOnTeamInHackathonException(UUID userId, UUID hackathonId) {
			super("User " + userId + " is already on a team in hackathon " + hackathonId);
		}
	}
	public static class NotOrgMemberException extends RuntimeException {
		public NotOrgMemberException(UUID userId, UUID orgId) {
			super("User " + userId + " is not a member of org " + orgId);
		}
	}
}
