package wtf.hackhub.application.admin;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCreateUserUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@Mock
	OrganizationMemberRepository orgMemberRepository;
	@Mock
	PasswordEncoder passwordEncoder;
	@InjectMocks
	AdminCreateUserUseCase useCase;

	static final UUID CALLER_ID = UUID.randomUUID();
	static final UUID ORG_ID = UUID.randomUUID();

	@Test
	void admin_creates_participant_in_org() {
		when(passwordEncoder.encode(any())).thenReturn("hash");
		when(profileRepository.existsByEmail(any())).thenReturn(false);
		Profile saved = new Profile("u@test.com", "User", "hash");
		when(profileRepository.save(any())).thenReturn(saved);

		Profile result = useCase.execute("u@test.com", "User", "pass", Profile.Role.PARTICIPANT, ORG_ID, CALLER_ID,
				false);

		assertThat(result).isNotNull();
		verify(orgMemberRepository).save(argThat(m -> m.getRole() == OrganizationMember.Role.MEMBER));
	}

	@Test
	void admin_creates_manager_becomes_org_owner() {
		when(passwordEncoder.encode(any())).thenReturn("hash");
		when(profileRepository.existsByEmail(any())).thenReturn(false);
		Profile saved = new Profile("mgr@test.com", "Mgr", "hash");
		saved.changeRole(Profile.Role.MANAGER);
		when(profileRepository.save(any())).thenReturn(saved);

		useCase.execute("mgr@test.com", "Mgr", "pass", Profile.Role.MANAGER, ORG_ID, CALLER_ID, false);

		verify(orgMemberRepository).save(argThat(m -> m.getRole() == OrganizationMember.Role.OWNER));
	}

	@Test
	void admin_creates_user_without_org() {
		when(passwordEncoder.encode(any())).thenReturn("hash");
		when(profileRepository.existsByEmail(any())).thenReturn(false);
		Profile saved = new Profile("a@test.com", "Admin", "hash");
		when(profileRepository.save(any())).thenReturn(saved);

		useCase.execute("a@test.com", "Admin", "pass", Profile.Role.ADMIN, null, CALLER_ID, false);

		verify(orgMemberRepository, never()).save(any());
	}

	@Test
	void duplicate_email_throws() {
		when(profileRepository.existsByEmail("dup@test.com")).thenReturn(true);

		assertThatThrownBy(
				() -> useCase.execute("dup@test.com", "X", "p", Profile.Role.PARTICIPANT, null, CALLER_ID, false))
				.isInstanceOf(AdminCreateUserUseCase.EmailAlreadyRegisteredException.class);
	}

	@Test
	void manager_cannot_create_admin() {
		assertThatThrownBy(() -> useCase.execute("a@test.com", "A", "p", Profile.Role.ADMIN, null, CALLER_ID, true))
				.isInstanceOf(AccessDeniedException.class);
	}

	@Test
	void manager_resolves_org_from_own_membership() {
		OrganizationMember membership = new OrganizationMember(ORG_ID, CALLER_ID, OrganizationMember.Role.OWNER);
		when(orgMemberRepository.findAllByUserId(CALLER_ID)).thenReturn(List.of(membership));
		when(passwordEncoder.encode(any())).thenReturn("hash");
		when(profileRepository.existsByEmail(any())).thenReturn(false);
		Profile saved = new Profile("u@test.com", "U", "hash");
		when(profileRepository.save(any())).thenReturn(saved);

		useCase.execute("u@test.com", "U", "pass", Profile.Role.PARTICIPANT, UUID.randomUUID(), CALLER_ID, true);

		verify(orgMemberRepository).save(argThat(m -> m.getOrganizationId().equals(ORG_ID)));
	}

	@Test
	void manager_with_no_org_throws() {
		when(orgMemberRepository.findAllByUserId(CALLER_ID)).thenReturn(List.of());

		assertThatThrownBy(
				() -> useCase.execute("u@test.com", "U", "pass", Profile.Role.PARTICIPANT, null, CALLER_ID, true))
				.isInstanceOf(AdminCreateUserUseCase.CallerNotInOrganizationException.class);
	}
}
