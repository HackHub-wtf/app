package wtf.hackhub.application.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteTeamUseCaseTest {

	@Mock
	TeamRepository teamRepository;
	@Mock
	TeamMemberRepository teamMemberRepository;
	@InjectMocks
	DeleteTeamUseCase useCase;

	@Test
	void deletes_members_then_team() {
		UUID id = UUID.randomUUID();
		when(teamRepository.existsById(id)).thenReturn(true);

		useCase.execute(id);

		verify(teamMemberRepository).deleteAllByTeamId(id);
		verify(teamRepository).deleteById(id);
	}

	@Test
	void not_found_throws() {
		UUID id = UUID.randomUUID();
		when(teamRepository.existsById(id)).thenReturn(false);

		assertThatThrownBy(() -> useCase.execute(id)).isInstanceOf(JoinTeamUseCase.TeamNotFoundException.class);
	}
}
