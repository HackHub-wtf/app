package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateMemberRoleUseCaseTest {

	@Mock
	OrganizationMemberRepository memberRepo;
	@InjectMocks
	UpdateMemberRoleUseCase useCase;

	static final UUID ORG_ID = UUID.randomUUID();
	static final UUID USER_ID = UUID.randomUUID();

	@Test
	void promotes_member_to_manager() {
		OrganizationMember member = new OrganizationMember(ORG_ID, USER_ID, OrganizationMember.Role.MEMBER);
		when(memberRepo.findByOrganizationIdAndUserId(ORG_ID, USER_ID)).thenReturn(Optional.of(member));
		when(memberRepo.save(any())).thenReturn(member);

		OrganizationMember result = useCase.execute(ORG_ID, USER_ID, OrganizationMember.Role.MANAGER);
		assertThat(result.getRole()).isEqualTo(OrganizationMember.Role.MANAGER);
	}

	@Test
	void demotes_manager_to_member() {
		OrganizationMember member = new OrganizationMember(ORG_ID, USER_ID, OrganizationMember.Role.MANAGER);
		when(memberRepo.findByOrganizationIdAndUserId(ORG_ID, USER_ID)).thenReturn(Optional.of(member));
		when(memberRepo.save(any())).thenReturn(member);

		OrganizationMember result = useCase.execute(ORG_ID, USER_ID, OrganizationMember.Role.MEMBER);
		assertThat(result.getRole()).isEqualTo(OrganizationMember.Role.MEMBER);
	}

	@Test
	void member_not_found_throws() {
		when(memberRepo.findByOrganizationIdAndUserId(ORG_ID, USER_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute(ORG_ID, USER_ID, OrganizationMember.Role.MANAGER))
				.isInstanceOf(UpdateMemberRoleUseCase.MemberNotFoundException.class);
	}
}
