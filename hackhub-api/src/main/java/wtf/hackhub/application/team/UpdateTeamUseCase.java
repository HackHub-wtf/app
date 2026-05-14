package wtf.hackhub.application.team;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Team;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.UUID;

@Service
public class UpdateTeamUseCase {

	private final TeamRepository teamRepository;

	public UpdateTeamUseCase(TeamRepository teamRepository) {
		this.teamRepository = teamRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @teamSecurity.isLeaderOrAdmin(#teamId, authentication)")
	public Team execute(UUID teamId, String name, String description, boolean open, List<String> skills,
			String avatarUrl) {
		Team team = teamRepository.findById(teamId)
				.orElseThrow(() -> new JoinTeamUseCase.TeamNotFoundException(teamId));
		team.update(name, description, open, skills, avatarUrl);
		return teamRepository.save(team);
	}
}
