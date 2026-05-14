package wtf.hackhub.application.hackathon;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetHackathonsUseCaseTest {

	@Mock
	HackathonRepository hackathonRepository;
	@Mock
	OrganizationMemberRepository memberRepository;
	@InjectMocks
	GetHackathonsUseCase useCase;

	static Hackathon hackathon() {
		return new Hackathon("h", "d", Instant.now(), Instant.now().plusSeconds(3600), "KEY123", 4, 100,
				UUID.randomUUID(), null);
	}

	@Test
	void lists_all_returns_page() {
		when(hackathonRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(hackathon())));

		var page = useCase.listAll(Pageable.unpaged());
		assertThat(page.getTotalElements()).isEqualTo(1);
	}

	@Test
	void lists_by_status() {
		when(hackathonRepository.findByStatusOrderByCreatedAtDesc(any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of()));

		var page = useCase.listByStatus(Hackathon.Status.OPEN, Pageable.unpaged());
		assertThat(page).isEmpty();
	}

	@Test
	void get_by_id_returns_hackathon() {
		UUID id = UUID.randomUUID();
		Hackathon h = hackathon();
		when(hackathonRepository.findById(id)).thenReturn(Optional.of(h));

		assertThat(useCase.getById(id)).isSameAs(h);
	}

	@Test
	void get_by_id_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(hackathonRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getById(id))
				.isInstanceOf(GetHackathonsUseCase.HackathonNotFoundException.class);
	}

	@Test
	void list_for_user_returns_empty_when_no_orgs() {
		UUID userId = UUID.randomUUID();
		when(memberRepository.findAllByUserId(userId)).thenReturn(List.of());

		var page = useCase.listForUser(userId, Pageable.unpaged());
		assertThat(page).isEmpty();
	}

	@Test
	void list_for_user_returns_org_hackathons() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);
		when(memberRepository.findAllByUserId(userId)).thenReturn(List.of(member));
		when(hackathonRepository.findByOrganizationIdInOrderByCreatedAtDesc(any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(hackathon())));

		var page = useCase.listForUser(userId, Pageable.unpaged());
		assertThat(page.getTotalElements()).isEqualTo(1);
	}
}
