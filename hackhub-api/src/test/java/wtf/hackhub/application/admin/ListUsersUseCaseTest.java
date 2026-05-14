package wtf.hackhub.application.admin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListUsersUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@InjectMocks
	ListUsersUseCase useCase;

	@Test
	void execute_returns_page_of_profiles() {
		Pageable pageable = PageRequest.of(0, 10);
		Profile p = new Profile("a@b.com", "Alice", "hash");
		Page<Profile> page = new PageImpl<>(List.of(p));
		when(profileRepository.findAll(pageable)).thenReturn(page);

		Page<Profile> result = useCase.execute(pageable);

		assertThat(result.getContent()).hasSize(1);
		assertThat(result.getContent().get(0).getEmail()).isEqualTo("a@b.com");
	}

	@Test
	void execute_returns_empty_page_when_no_users() {
		Pageable pageable = PageRequest.of(0, 10);
		when(profileRepository.findAll(pageable)).thenReturn(Page.empty());

		Page<Profile> result = useCase.execute(pageable);

		assertThat(result.getContent()).isEmpty();
	}
}
