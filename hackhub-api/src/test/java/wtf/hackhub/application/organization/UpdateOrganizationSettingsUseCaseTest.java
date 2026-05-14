package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateOrganizationSettingsUseCaseTest {

	@Mock
	OrganizationRepository organizationRepository;
	@Mock
	OrganizationMemberRepository memberRepository;
	@InjectMocks
	UpdateOrganizationSettingsUseCase useCase;

	@Test
	void owner_can_update() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", userId);
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.OWNER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));
		when(organizationRepository.save(any())).thenReturn(org);

		useCase.execute(orgId, userId, Organization.Visibility.OPEN, Organization.JoinPolicy.SELF_REGISTER);
		verify(organizationRepository).save(org);
	}

	@Test
	void manager_can_update() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MANAGER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));
		when(organizationRepository.save(any())).thenReturn(org);

		useCase.execute(orgId, userId, Organization.Visibility.CLOSED, Organization.JoinPolicy.INVITE_ONLY);
		verify(organizationRepository).save(org);
	}

	@Test
	void non_owner_throws() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThatThrownBy(() -> useCase.execute(orgId, userId, Organization.Visibility.OPEN,
				Organization.JoinPolicy.SELF_REGISTER))
				.isInstanceOf(UpdateOrganizationSettingsUseCase.NotOwnerException.class);
	}

	@Test
	void org_not_found_throws() {
		UUID orgId = UUID.randomUUID();
		when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute(orgId, UUID.randomUUID(), Organization.Visibility.OPEN,
				Organization.JoinPolicy.SELF_REGISTER))
				.isInstanceOf(UpdateOrganizationSettingsUseCase.OrganizationNotFoundException.class);
	}
}
