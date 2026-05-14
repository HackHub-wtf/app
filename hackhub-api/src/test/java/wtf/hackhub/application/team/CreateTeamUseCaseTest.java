package wtf.hackhub.application.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateTeamUseCaseTest {

	@Mock
	TeamRepository teamRepository;
	@Mock
	TeamMemberRepository teamMemberRepository;
	@Mock
	HackathonRepository hackathonRepository;
	@InjectMocks
	CreateTeamUseCase useCase;

	private Hackathon openHackathon(UUID id) {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "KEY", 4, 100,
				UUID.randomUUID(), null);
		h.open();
		return h;
	}

	@Test
	void creates_team_and_leader_in_same_transaction() {
		UUID hackathonId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Hackathon h = openHackathon(hackathonId);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(h));
		when(teamRepository.existsByNameAndHackathonId("Alpha", hackathonId)).thenReturn(false);
		Team savedTeam = new Team("Alpha", "desc", hackathonId, userId);
		when(teamRepository.save(any())).thenReturn(savedTeam);
		when(teamMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		useCase.execute("Alpha", "desc", hackathonId, userId);

		// Verify team saved first, THEN member
		var inOrder = inOrder(teamRepository, teamMemberRepository);
		inOrder.verify(teamRepository).save(any(Team.class));
		inOrder.verify(teamMemberRepository).save(any(TeamMember.class));

		// Verify leader role assigned
		ArgumentCaptor<TeamMember> cap = ArgumentCaptor.forClass(TeamMember.class);
		verify(teamMemberRepository).save(cap.capture());
		assertThat(cap.getValue().getRole()).isEqualTo(TeamMember.Role.LEADER);
		assertThat(cap.getValue().getUserId()).isEqualTo(userId);
	}

	@Test
	void rejects_duplicate_team_name() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(openHackathon(hackathonId)));
		when(teamRepository.existsByNameAndHackathonId("Alpha", hackathonId)).thenReturn(true);

		assertThatThrownBy(() -> useCase.execute("Alpha", "desc", hackathonId, UUID.randomUUID()))
				.isInstanceOf(CreateTeamUseCase.TeamNameTakenException.class);

		verify(teamRepository, never()).save(any());
		verify(teamMemberRepository, never()).save(any());
	}

	@Test
	void rejects_team_in_completed_hackathon() {
		UUID hackathonId = UUID.randomUUID();
		Hackathon h = openHackathon(hackathonId);
		h.start();
		h.complete();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(h));

		assertThatThrownBy(() -> useCase.execute("Beta", "desc", hackathonId, UUID.randomUUID()))
				.isInstanceOf(CreateTeamUseCase.HackathonNotAcceptingTeamsException.class);
	}

	@Test
	void rejects_team_in_draft_hackathon() {
		UUID hackathonId = UUID.randomUUID();
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "K2", 4, 100,
				UUID.randomUUID(), null); // status = DRAFT
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(h));

		assertThatThrownBy(() -> useCase.execute("Gamma", "desc", hackathonId, UUID.randomUUID()))
				.isInstanceOf(CreateTeamUseCase.HackathonNotAcceptingTeamsException.class);
	}

	@Test
	void rejects_creator_already_on_a_team() {
		UUID hackathonId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(openHackathon(hackathonId)));
		when(teamRepository.existsByNameAndHackathonId("Delta", hackathonId)).thenReturn(false);
		when(teamMemberRepository.existsByHackathonIdAndUserId(hackathonId, userId)).thenReturn(true);

		assertThatThrownBy(() -> useCase.execute("Delta", "desc", hackathonId, userId))
				.isInstanceOf(JoinTeamUseCase.AlreadyOnTeamInHackathonException.class);
	}
}
