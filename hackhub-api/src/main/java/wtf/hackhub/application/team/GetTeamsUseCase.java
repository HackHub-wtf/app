package wtf.hackhub.application.team;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.UUID;

@Service
public class GetTeamsUseCase {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;

	public GetTeamsUseCase(TeamRepository teamRepository, TeamMemberRepository memberRepo) {
		this.teamRepository = teamRepository;
		this.teamMemberRepository = memberRepo;
	}

	@Transactional(readOnly = true)
	public List<Team> listByHackathon(UUID hackathonId) {
		return teamRepository.findAllByHackathonId(hackathonId);
	}

	@Transactional(readOnly = true)
	public Team getById(UUID id) {
		return teamRepository.findById(id).orElseThrow(() -> new JoinTeamUseCase.TeamNotFoundException(id));
	}

	@Transactional(readOnly = true)
	public List<TeamMember> getMembers(UUID teamId) {
		return teamMemberRepository.findAllByTeamId(teamId);
	}

	@Transactional(readOnly = true)
	public List<TeamMember> getUserTeams(UUID userId) {
		return teamMemberRepository.findAllByUserId(userId);
	}
}
