package wtf.hackhub.application.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JoinLeaveTeamUseCaseTest {

	@Mock
	TeamRepository teamRepository;
	@Mock
	TeamMemberRepository teamMemberRepository;
	@Mock
	HackathonRepository hackathonRepository;
	@Mock
	OrganizationMemberRepository orgMemberRepository;

	// tested separately but share mocks via @InjectMocks pairs
	JoinTeamUseCase joinUseCase;
	LeaveTeamUseCase leaveUseCase;

	@org.junit.jupiter.api.BeforeEach
	void setUp() {
		joinUseCase = new JoinTeamUseCase(teamRepository, teamMemberRepository, hackathonRepository,
				orgMemberRepository);
		leaveUseCase = new LeaveTeamUseCase(teamMemberRepository);
	}

	private Team openTeam(UUID hackathonId, UUID createdBy) {
		return new Team("Alpha", "desc", hackathonId, createdBy);
	}

	@Test
	void join_adds_member() {
		UUID teamId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		Team team = openTeam(hackathonId, UUID.randomUUID());
		Hackathon hackathon = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "K", 4, 100,
				UUID.randomUUID(), null);

		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
		when(teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)).thenReturn(false);
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(teamMemberRepository.findAllByTeamId(teamId)).thenReturn(List.of());
		when(teamMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		TeamMember result = joinUseCase.execute(teamId, userId);

		assertThat(result.getRole()).isEqualTo(TeamMember.Role.MEMBER);
	}

	@Test
	void join_rejects_if_team_closed() {
		UUID teamId = UUID.randomUUID();
		Team team = openTeam(UUID.randomUUID(), UUID.randomUUID());
		team.update(team.getName(), team.getDescription(), false, List.of(), null); // closed

		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

		assertThatThrownBy(() -> joinUseCase.execute(teamId, UUID.randomUUID()))
				.isInstanceOf(JoinTeamUseCase.TeamClosedException.class);
	}

	@Test
	void join_rejects_if_already_member() {
		UUID teamId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Team team = openTeam(UUID.randomUUID(), UUID.randomUUID());

		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
		when(teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)).thenReturn(true);

		assertThatThrownBy(() -> joinUseCase.execute(teamId, userId))
				.isInstanceOf(JoinTeamUseCase.AlreadyMemberException.class);
	}

	@Test
	void join_rejects_if_team_full() {
		UUID teamId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		Team team = openTeam(hackathonId, UUID.randomUUID());
		Hackathon hackathon = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "K", 2, 100,
				UUID.randomUUID(), null); // maxTeamSize=2

		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
		when(teamMemberRepository.existsByTeamIdAndUserId(any(), any())).thenReturn(false);
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		// 2 existing members
		when(teamMemberRepository.findAllByTeamId(teamId))
				.thenReturn(List.of(mock(TeamMember.class), mock(TeamMember.class)));

		assertThatThrownBy(() -> joinUseCase.execute(teamId, UUID.randomUUID()))
				.isInstanceOf(JoinTeamUseCase.TeamFullException.class);
	}

	@Test
	void leader_can_leave_if_last_member() {
		UUID teamId = UUID.randomUUID();
		UUID leaderId = UUID.randomUUID();
		TeamMember leader = new TeamMember(teamId, leaderId, TeamMember.Role.LEADER);

		when(teamMemberRepository.findByTeamIdAndUserId(teamId, leaderId)).thenReturn(Optional.of(leader));
		when(teamMemberRepository.findAllByTeamId(teamId)).thenReturn(List.of(leader));

		leaveUseCase.execute(teamId, leaderId);
		verify(teamMemberRepository).delete(leader);
	}

	@Test
	void leader_cannot_leave_with_other_members_present() {
		UUID teamId = UUID.randomUUID();
		UUID leaderId = UUID.randomUUID();
		TeamMember leader = new TeamMember(teamId, leaderId, TeamMember.Role.LEADER);
		TeamMember other = new TeamMember(teamId, UUID.randomUUID(), TeamMember.Role.MEMBER);

		when(teamMemberRepository.findByTeamIdAndUserId(teamId, leaderId)).thenReturn(Optional.of(leader));
		when(teamMemberRepository.findAllByTeamId(teamId)).thenReturn(List.of(leader, other));

		assertThatThrownBy(() -> leaveUseCase.execute(teamId, leaderId))
				.isInstanceOf(LeaveTeamUseCase.LeaderCannotLeaveException.class);
		verify(teamMemberRepository, never()).delete(any());
	}
}
