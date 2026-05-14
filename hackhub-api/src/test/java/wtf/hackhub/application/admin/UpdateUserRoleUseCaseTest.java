package wtf.hackhub.application.admin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateUserRoleUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@InjectMocks
	UpdateUserRoleUseCase useCase;

	@Test
	void changes_role_to_manager() {
		UUID userId = UUID.randomUUID();
		Profile profile = new Profile("u@test.com", "User", "hash");

		when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));
		when(profileRepository.save(profile)).thenReturn(profile);

		Profile result = useCase.execute(userId, Profile.Role.MANAGER);

		assertThat(result.getRole()).isEqualTo(Profile.Role.MANAGER);
		verify(profileRepository).save(profile);
	}

	@Test
	void throws_not_found_for_unknown_user() {
		when(profileRepository.findById(any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute(UUID.randomUUID(), Profile.Role.ADMIN))
				.isInstanceOf(UpdateUserRoleUseCase.UserNotFoundException.class);
		verify(profileRepository, never()).save(any());
	}
}
