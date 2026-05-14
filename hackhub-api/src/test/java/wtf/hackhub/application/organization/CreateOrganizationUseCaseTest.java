package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;
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
class CreateOrganizationUseCaseTest {

	@Mock
	OrganizationRepository orgRepo;
	@Mock
	OrganizationMemberRepository memberRepo;
	@Mock
	ProfileRepository profileRepo;
	@InjectMocks
	CreateOrganizationUseCase useCase;

	@Test
	void creates_org_with_owner_membership() {
		UUID userId = UUID.randomUUID();
		Profile profile = new Profile("a@b.com", "Alice", "hash");

		when(orgRepo.existsBySlug("acme")).thenReturn(false);
		when(profileRepo.findById(userId)).thenReturn(Optional.of(profile));
		Organization savedOrg = new Organization("Acme", "acme", userId);
		when(orgRepo.save(any())).thenReturn(savedOrg);
		when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));

		Organization result = useCase.execute("Acme", "acme", userId);

		assertThat(result.getName()).isEqualTo("Acme");

		ArgumentCaptor<OrganizationMember> memberCaptor = ArgumentCaptor.forClass(OrganizationMember.class);
		verify(memberRepo).save(memberCaptor.capture());
		assertThat(memberCaptor.getValue().getRole()).isEqualTo(OrganizationMember.Role.OWNER);
		assertThat(memberCaptor.getValue().getUserId()).isEqualTo(userId);
	}

	@Test
	void rejects_duplicate_slug() {
		when(orgRepo.existsBySlug("taken")).thenReturn(true);

		assertThatThrownBy(() -> useCase.execute("Org", "taken", UUID.randomUUID()))
				.isInstanceOf(CreateOrganizationUseCase.SlugAlreadyTakenException.class);

		verify(orgRepo, never()).save(any());
		verify(memberRepo, never()).save(any());
	}

	@Test
	void saves_org_before_creating_membership() {
		UUID userId = UUID.randomUUID();
		Profile profile = new Profile("x@test.com", "X User", "hash");
		Organization savedOrg = new Organization("X", "x", userId);

		when(orgRepo.existsBySlug("x")).thenReturn(false);
		when(profileRepo.findById(userId)).thenReturn(Optional.of(profile));
		when(orgRepo.save(any())).thenReturn(savedOrg);
		when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));

		useCase.execute("X", "x", userId);

		var inOrder = inOrder(orgRepo, memberRepo);
		inOrder.verify(orgRepo).save(any());
		inOrder.verify(memberRepo).save(any());
	}
}
