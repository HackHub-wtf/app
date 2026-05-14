package wtf.hackhub.application.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetTeamsUseCaseTest {

	@Mock
	TeamRepository teamRepository;
	@Mock
	TeamMemberRepository teamMemberRepository;
	@InjectMocks
	GetTeamsUseCase useCase;

	@Test
	void list_by_hackathon_returns_teams() {
		UUID hackathonId = UUID.randomUUID();
		Team team = new Team("Alpha", "desc", hackathonId, UUID.randomUUID());
		when(teamRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(team));

		List<Team> result = useCase.listByHackathon(hackathonId);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).getName()).isEqualTo("Alpha");
	}

	@Test
	void get_by_id_returns_team_when_found() {
		UUID teamId = UUID.randomUUID();
		Team team = new Team("Beta", "desc", UUID.randomUUID(), UUID.randomUUID());
		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

		Team result = useCase.getById(teamId);

		assertThat(result.getName()).isEqualTo("Beta");
	}

	@Test
	void get_by_id_throws_when_not_found() {
		UUID teamId = UUID.randomUUID();
		when(teamRepository.findById(teamId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getById(teamId)).isInstanceOf(JoinTeamUseCase.TeamNotFoundException.class);
	}

	@Test
	void get_members_returns_members() {
		UUID teamId = UUID.randomUUID();
		TeamMember member = new TeamMember(teamId, UUID.randomUUID(), TeamMember.Role.LEADER);
		when(teamMemberRepository.findAllByTeamId(teamId)).thenReturn(List.of(member));

		List<TeamMember> result = useCase.getMembers(teamId);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).getRole()).isEqualTo(TeamMember.Role.LEADER);
	}

	@Test
	void get_user_teams_returns_memberships() {
		UUID userId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		TeamMember membership = new TeamMember(teamId, userId, TeamMember.Role.MEMBER);
		when(teamMemberRepository.findAllByUserId(userId)).thenReturn(List.of(membership));

		List<TeamMember> result = useCase.getUserTeams(userId);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).getUserId()).isEqualTo(userId);
	}

	@Test
	void list_by_hackathon_returns_empty_when_no_teams() {
		UUID hackathonId = UUID.randomUUID();
		when(teamRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of());

		List<Team> result = useCase.listByHackathon(hackathonId);

		assertThat(result).isEmpty();
	}
}
