package wtf.hackhub.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;

import java.util.UUID;

@Service("teamSecurity")
public class TeamSecurityService {

	private final TeamMemberRepository teamMemberRepository;

	public TeamSecurityService(TeamMemberRepository teamMemberRepository) {
		this.teamMemberRepository = teamMemberRepository;
	}

	public boolean isLeaderOrAdmin(UUID teamId, Authentication auth) {
		UUID userId = (UUID) auth.getPrincipal();
		return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
				.map(m -> m.getRole() == TeamMember.Role.LEADER).orElse(false);
	}
}
