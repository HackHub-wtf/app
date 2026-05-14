package wtf.hackhub.application.team;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.UUID;

@Service
public class DeleteTeamUseCase {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;

	public DeleteTeamUseCase(TeamRepository teamRepository, TeamMemberRepository teamMemberRepository) {
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @teamSecurity.isLeaderOrAdmin(#teamId, authentication)")
	public void execute(UUID teamId) {
		if (!teamRepository.existsById(teamId)) {
			throw new JoinTeamUseCase.TeamNotFoundException(teamId);
		}
		teamMemberRepository.deleteAllByTeamId(teamId);
		teamRepository.deleteById(teamId);
	}
}
