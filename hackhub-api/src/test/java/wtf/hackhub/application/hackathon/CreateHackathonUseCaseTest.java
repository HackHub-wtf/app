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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateHackathonUseCaseTest {

	@Mock
	HackathonRepository hackathonRepository;
	@InjectMocks
	CreateHackathonUseCase useCase;

	static final UUID CREATOR = UUID.randomUUID();

	@Test
	void creates_hackathon_with_generated_registration_key() {
		var cmd = new CreateHackathonUseCase.Command("Spring Hackathon", "desc", Instant.now(),
				Instant.now().plusSeconds(86400), 4, 100, CREATOR, null, List.of(), List.of());

		Hackathon saved = new Hackathon("Spring Hackathon", "desc", Instant.now(), Instant.now().plusSeconds(86400),
				"ABCDEF123456", 4, 100, CREATOR, null);

		when(hackathonRepository.existsByRegistrationKey(anyString())).thenReturn(false);
		when(hackathonRepository.save(any())).thenReturn(saved);

		Hackathon result = useCase.execute(cmd);

		assertThat(result.getTitle()).isEqualTo("Spring Hackathon");
	}

	@Test
	void retries_key_generation_on_collision() {
		var cmd = new CreateHackathonUseCase.Command("h", "d", Instant.now(), Instant.now().plusSeconds(3600), 4, 50,
				CREATOR, null, List.of(), List.of());

		Hackathon saved = new Hackathon("h", "d", Instant.now(), Instant.now().plusSeconds(3600), "UNIQUE000001", 4, 50,
				CREATOR, null);

		// First call collides, second is unique
		when(hackathonRepository.existsByRegistrationKey(anyString())).thenReturn(true).thenReturn(false);
		when(hackathonRepository.save(any())).thenReturn(saved);

		Hackathon result = useCase.execute(cmd);
		assertThat(result).isNotNull();
	}
}
