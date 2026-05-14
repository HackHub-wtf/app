package wtf.hackhub.application.profile;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateProfileUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@InjectMocks
	UpdateProfileUseCase useCase;

	@Test
	void get_by_id_returns_profile() {
		UUID id = UUID.randomUUID();
		Profile profile = new Profile("u@test.com", "User", "hash");
		when(profileRepository.findById(id)).thenReturn(Optional.of(profile));

		Profile result = useCase.getById(id);

		assertThat(result.getEmail()).isEqualTo("u@test.com");
	}

	@Test
	void get_by_id_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(profileRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getById(id)).isInstanceOf(UpdateProfileUseCase.ProfileNotFoundException.class)
				.hasMessageContaining(id.toString());
	}

	@Test
	void update_changes_name_and_skills() {
		UUID id = UUID.randomUUID();
		Profile profile = new Profile("u@test.com", "Old Name", "hash");
		when(profileRepository.findById(id)).thenReturn(Optional.of(profile));
		when(profileRepository.save(profile)).thenReturn(profile);

		Profile result = useCase.update(id, "New Name", null, List.of("java", "spring"));

		assertThat(result.getName()).isEqualTo("New Name");
		assertThat(result.getSkills()).containsExactly("java", "spring");
		verify(profileRepository).save(profile);
	}

	@Test
	void update_preserves_existing_name_when_null_passed() {
		UUID id = UUID.randomUUID();
		Profile profile = new Profile("u@test.com", "Keep This", "hash");
		when(profileRepository.findById(id)).thenReturn(Optional.of(profile));
		when(profileRepository.save(profile)).thenReturn(profile);

		useCase.update(id, null, null, null);

		assertThat(profile.getName()).isEqualTo("Keep This");
	}

	@Test
	void update_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(profileRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.update(id, "Name", null, null))
				.isInstanceOf(UpdateProfileUseCase.ProfileNotFoundException.class);

		verify(profileRepository, never()).save(any());
	}
}
