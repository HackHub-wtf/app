package wtf.hackhub.application.hackathon;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetHackathonsUseCase {

	private final HackathonRepository hackathonRepository;
	private final OrganizationMemberRepository memberRepository;

	public GetHackathonsUseCase(HackathonRepository hackathonRepository,
			OrganizationMemberRepository memberRepository) {
		this.hackathonRepository = hackathonRepository;
		this.memberRepository = memberRepository;
	}

	/** Admin-only: returns every hackathon in the platform. */
	@Transactional(readOnly = true)
	public Page<Hackathon> listAll(Pageable pageable) {
		return hackathonRepository.findAllByOrderByCreatedAtDesc(pageable);
	}

	/** Org-scoped: returns only hackathons belonging to orgs the caller is a member of. */
	@Transactional(readOnly = true)
	public Page<Hackathon> listForUser(UUID userId, Pageable pageable) {
		List<UUID> orgIds = memberRepository.findAllByUserId(userId)
				.stream()
				.map(m -> m.getOrganizationId())
				.collect(Collectors.toList());
		if (orgIds.isEmpty()) {
			return Page.empty(pageable);
		}
		return hackathonRepository.findByOrganizationIdInOrderByCreatedAtDesc(orgIds, pageable);
	}

	@Transactional(readOnly = true)
	public Page<Hackathon> listByStatus(Hackathon.Status status, Pageable pageable) {
		return hackathonRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
	}

	@Transactional(readOnly = true)
	public Hackathon getById(UUID id) {
		return hackathonRepository.findById(id).orElseThrow(() -> new HackathonNotFoundException(id));
	}

	public static class HackathonNotFoundException extends RuntimeException {
		public HackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}
}
