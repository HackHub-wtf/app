package wtf.hackhub.application.hackathon;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateHackathonUseCaseTest {

	@Mock
	HackathonRepository hackathonRepository;
	@InjectMocks
	UpdateHackathonUseCase useCase;

	static Hackathon hackathon(UUID id) {
		Hackathon h = new Hackathon("old title", "desc", Instant.now(), Instant.now().plusSeconds(3600), "KEY123", 4,
				100, UUID.randomUUID(), null);
		return h;
	}

	@Test
	void update_changes_title_and_description() {
		UUID id = UUID.randomUUID();
		Hackathon existing = hackathon(id);
		when(hackathonRepository.findById(any())).thenReturn(Optional.of(existing));
		when(hackathonRepository.save(any())).thenReturn(existing);

		var cmd = new UpdateHackathonUseCase.Command(id, "new title", "new desc", Instant.now(),
				Instant.now().plusSeconds(7200), 5, 200, null, null, List.of(), List.of());

		Hackathon result = useCase.execute(cmd);
		assertThat(result).isNotNull();
	}

	@Test
	void update_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(hackathonRepository.findById(id)).thenReturn(Optional.empty());

		var cmd = new UpdateHackathonUseCase.Command(id, "t", "d", Instant.now(), Instant.now().plusSeconds(3600), 4,
				100, null, null, List.of(), List.of());

		assertThatThrownBy(() -> useCase.execute(cmd))
				.isInstanceOf(GetHackathonsUseCase.HackathonNotFoundException.class);
	}

	@Test
	void transition_draft_to_open() {
		UUID id = UUID.randomUUID();
		Hackathon h = hackathon(id);
		when(hackathonRepository.findById(id)).thenReturn(Optional.of(h));
		when(hackathonRepository.save(any())).thenReturn(h);

		Hackathon result = useCase.transitionStatus(id, Hackathon.Status.OPEN);
		assertThat(result.getStatus()).isEqualTo(Hackathon.Status.OPEN);
	}

	@Test
	void transition_to_invalid_status_throws() {
		UUID id = UUID.randomUUID();
		Hackathon h = hackathon(id);
		when(hackathonRepository.findById(id)).thenReturn(Optional.of(h));

		assertThatThrownBy(() -> useCase.transitionStatus(id, Hackathon.Status.DRAFT))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void transition_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(hackathonRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.transitionStatus(id, Hackathon.Status.OPEN))
				.isInstanceOf(GetHackathonsUseCase.HackathonNotFoundException.class);
	}
}
