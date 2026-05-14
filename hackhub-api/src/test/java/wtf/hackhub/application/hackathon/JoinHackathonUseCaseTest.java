package wtf.hackhub.application.hackathon;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JoinHackathonUseCaseTest {

	@Mock
	HackathonRepository hackathonRepository;
	@InjectMocks
	JoinHackathonUseCase useCase;

	private Hackathon openHackathon() {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "KEY123", 4, 100,
				UUID.randomUUID(), null);
		h.open();
		return h;
	}

	@Test
	void increments_participants_on_valid_key() {
		Hackathon h = openHackathon();
		when(hackathonRepository.findByRegistrationKey("KEY123")).thenReturn(Optional.of(h));
		when(hackathonRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		Hackathon result = useCase.execute("KEY123");

		assertThat(result.getCurrentParticipants()).isEqualTo(1);
		verify(hackathonRepository).save(h);
	}

	@Test
	void rejects_invalid_key() {
		when(hackathonRepository.findByRegistrationKey("BADKEY")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute("BADKEY"))
				.isInstanceOf(JoinHackathonUseCase.InvalidRegistrationKeyException.class);
		verify(hackathonRepository, never()).save(any());
	}

	@Test
	void rejects_join_when_hackathon_is_draft() {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "DRAFTKEY", 4, 100,
				UUID.randomUUID(), null);
		// status is DRAFT — not opened
		when(hackathonRepository.findByRegistrationKey("DRAFTKEY")).thenReturn(Optional.of(h));

		assertThatThrownBy(() -> useCase.execute("DRAFTKEY"))
				.isInstanceOf(JoinHackathonUseCase.HackathonNotOpenException.class);
		verify(hackathonRepository, never()).save(any());
	}

	@Test
	void rejects_join_when_at_capacity() {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "FULLKEY", 4, 1,
				UUID.randomUUID(), null);
		h.open();
		h.incrementParticipants(); // fill the one slot
		when(hackathonRepository.findByRegistrationKey("FULLKEY")).thenReturn(Optional.of(h));

		assertThatThrownBy(() -> useCase.execute("FULLKEY")).isInstanceOf(Hackathon.FullCapacityException.class);
	}
}
