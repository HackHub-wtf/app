package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JoinOrganizationUseCaseTest {

	@Mock
	OrganizationRepository orgRepo;
	@Mock
	OrganizationMemberRepository memberRepo;
	@Mock
	ProfileRepository profileRepo;
	@InjectMocks
	JoinOrganizationUseCase useCase;

	@Test
	void joins_as_member_role() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		Organization org = new Organization("Org", "my-org", UUID.randomUUID());

		when(orgRepo.findBySlug("my-org")).thenReturn(Optional.of(org));
		when(memberRepo.existsByOrganizationIdAndUserId(any(), eq(userId))).thenReturn(false);
		when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
		when(profileRepo.findById(userId)).thenReturn(Optional.empty());

		OrganizationMember result = useCase.execute("my-org", userId);

		assertThat(result.getRole()).isEqualTo(OrganizationMember.Role.MEMBER);
		assertThat(result.getUserId()).isEqualTo(userId);
	}

	@Test
	void throws_not_found_for_unknown_slug() {
		when(orgRepo.findBySlug("ghost")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute("ghost", UUID.randomUUID()))
				.isInstanceOf(JoinOrganizationUseCase.OrganizationNotFoundException.class);
	}

	@Test
	void throws_already_member_if_duplicate() {
		Organization org = new Organization("Org", "dup-org", UUID.randomUUID());
		UUID userId = UUID.randomUUID();

		when(orgRepo.findBySlug("dup-org")).thenReturn(Optional.of(org));
		when(memberRepo.existsByOrganizationIdAndUserId(any(), eq(userId))).thenReturn(true);

		assertThatThrownBy(() -> useCase.execute("dup-org", userId))
				.isInstanceOf(JoinOrganizationUseCase.AlreadyMemberException.class);

		verify(memberRepo, never()).save(any());
	}

	@Test
	void throws_join_not_allowed_for_invite_only_org() {
		Organization org = new Organization("Closed", "closed-org", UUID.randomUUID());
		org.updateSettings(Organization.Visibility.CLOSED, Organization.JoinPolicy.INVITE_ONLY);
		when(orgRepo.findBySlug("closed-org")).thenReturn(Optional.of(org));

		assertThatThrownBy(() -> useCase.execute("closed-org", UUID.randomUUID()))
				.isInstanceOf(JoinOrganizationUseCase.JoinNotAllowedException.class);
	}

	@Test
	void assigns_org_to_profile_when_profile_found() {
		UUID userId = UUID.randomUUID();
		Organization org = new Organization("Org", "org-x", UUID.randomUUID());
		wtf.hackhub.domain.Profile profile = new wtf.hackhub.domain.Profile("u@x.com", "User", "hash");

		when(orgRepo.findBySlug("org-x")).thenReturn(Optional.of(org));
		when(memberRepo.existsByOrganizationIdAndUserId(any(), eq(userId))).thenReturn(false);
		when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
		when(profileRepo.findById(userId)).thenReturn(Optional.of(profile));
		when(profileRepo.save(profile)).thenReturn(profile);

		useCase.execute("org-x", userId);

		assertThat(profile.getOrganizationId()).isEqualTo(org.getId());
	}
}
