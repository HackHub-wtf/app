package wtf.hackhub.application.team;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Team;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateTeamUseCaseTest {

	@Mock
	TeamRepository teamRepository;
	@InjectMocks
	UpdateTeamUseCase useCase;

	@Test
	void update_team_saves_changes() {
		UUID teamId = UUID.randomUUID();
		Team existing = new Team("Old Name", "Old desc", UUID.randomUUID(), UUID.randomUUID());
		when(teamRepository.findById(teamId)).thenReturn(Optional.of(existing));
		when(teamRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Team result = useCase.execute(teamId, "New Name", "New desc", false, List.of("Rust"), "http://avatar.png");

		assertThat(result.getName()).isEqualTo("New Name");
		assertThat(result.getDescription()).isEqualTo("New desc");
		assertThat(result.isOpen()).isFalse();
		assertThat(result.getSkills()).containsExactly("Rust");
		assertThat(result.getAvatarUrl()).isEqualTo("http://avatar.png");
		verify(teamRepository).save(existing);
	}

	@Test
	void update_throws_when_team_not_found() {
		UUID teamId = UUID.randomUUID();
		when(teamRepository.findById(teamId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute(teamId, "Name", "desc", true, List.of(), null))
				.isInstanceOf(JoinTeamUseCase.TeamNotFoundException.class);
	}
}
