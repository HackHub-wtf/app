package wtf.hackhub.application.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@Mock
	PasswordEncoder passwordEncoder;
	@InjectMocks
	RegisterUseCase useCase;

	@Test
	void registers_new_user_with_hashed_password() {
		when(profileRepository.existsByEmail("new@test.com")).thenReturn(false);
		when(passwordEncoder.encode("plain")).thenReturn("hashed");
		Profile saved = new Profile("new@test.com", "New User", "hashed");
		when(profileRepository.save(any())).thenReturn(saved);

		Profile result = useCase.execute("new@test.com", "New User", "plain");

		assertThat(result.getEmail()).isEqualTo("new@test.com");
		assertThat(result.getRole()).isEqualTo(Profile.Role.PARTICIPANT);
		verify(passwordEncoder).encode("plain");
		verify(profileRepository).save(any(Profile.class));
	}

	@Test
	void rejects_duplicate_email() {
		when(profileRepository.existsByEmail("taken@test.com")).thenReturn(true);

		assertThatThrownBy(() -> useCase.execute("taken@test.com", "Name", "pass"))
				.isInstanceOf(RegisterUseCase.EmailAlreadyRegisteredException.class);

		verify(profileRepository, never()).save(any());
	}
}
