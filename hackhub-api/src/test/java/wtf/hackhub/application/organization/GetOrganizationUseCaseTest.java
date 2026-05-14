package wtf.hackhub.application.organization;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetOrganizationUseCaseTest {

	@Mock
	OrganizationRepository orgRepo;
	@Mock
	OrganizationMemberRepository memberRepo;
	@Mock
	ProfileRepository profileRepo;

	GetOrganizationUseCase useCase;

	static final UUID ORG_ID = UUID.randomUUID();
	static final UUID USER_ID = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		useCase = new GetOrganizationUseCase(orgRepo, memberRepo, profileRepo);
	}

	@Test
	void get_by_id_returns_org() {
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		when(orgRepo.findById(ORG_ID)).thenReturn(Optional.of(org));

		assertThat(useCase.getById(ORG_ID)).isSameAs(org);
	}

	@Test
	void get_by_id_not_found_throws() {
		when(orgRepo.findById(ORG_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getById(ORG_ID))
				.isInstanceOf(JoinOrganizationUseCase.OrganizationNotFoundException.class);
	}

	@Test
	void get_members_returns_list() {
		OrganizationMember m1 = new OrganizationMember(ORG_ID, USER_ID, OrganizationMember.Role.MEMBER);
		when(memberRepo.findAllByOrganizationId(ORG_ID)).thenReturn(List.of(m1));
		when(profileRepo.findAllById(List.of(USER_ID))).thenReturn(List.of());

		List<GetOrganizationUseCase.EnrichedMember> result = useCase.getMembers(ORG_ID);
		assertThat(result).hasSize(1);
		assertThat(result.get(0).member().getUserId()).isEqualTo(USER_ID);
	}

	@Test
	void get_members_returns_empty_list_when_no_members() {
		when(memberRepo.findAllByOrganizationId(ORG_ID)).thenReturn(List.of());

		assertThat(useCase.getMembers(ORG_ID)).isEmpty();
	}

	@Test
	void get_user_membership_found() {
		OrganizationMember member = new OrganizationMember(ORG_ID, USER_ID, OrganizationMember.Role.MANAGER);
		when(memberRepo.findFirstByUserId(USER_ID)).thenReturn(Optional.of(member));

		OrganizationMember result = useCase.getUserMembership(USER_ID);
		assertThat(result.getRole()).isEqualTo(OrganizationMember.Role.MANAGER);
	}

	@Test
	void get_user_membership_not_found_throws() {
		when(memberRepo.findFirstByUserId(USER_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getUserMembership(USER_ID))
				.isInstanceOf(GetOrganizationUseCase.NotAMemberException.class);
	}
}
