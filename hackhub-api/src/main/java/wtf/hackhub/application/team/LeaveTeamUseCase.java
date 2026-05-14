package wtf.hackhub.application.team;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;

import java.util.UUID;

@Service
public class LeaveTeamUseCase {

	private final TeamMemberRepository teamMemberRepository;

	public LeaveTeamUseCase(TeamMemberRepository teamMemberRepository) {
		this.teamMemberRepository = teamMemberRepository;
	}

	@Transactional
	public void execute(UUID teamId, UUID userId) {
		TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.orElseThrow(() -> new JoinTeamUseCase.TeamNotFoundException(teamId));

		if (member.getRole() == TeamMember.Role.LEADER) {
			long memberCount = teamMemberRepository.findAllByTeamId(teamId).size();
			if (memberCount > 1) {
				throw new LeaderCannotLeaveException(teamId);
			}
		}

		teamMemberRepository.delete(member);
	}

	public static class LeaderCannotLeaveException extends RuntimeException {
		public LeaderCannotLeaveException(UUID teamId) {
			super("Team leader cannot leave while other members remain in team " + teamId
					+ ". Transfer leadership first.");
		}
	}
}
