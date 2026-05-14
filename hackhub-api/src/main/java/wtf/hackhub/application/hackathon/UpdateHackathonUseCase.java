package wtf.hackhub.application.hackathon;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class UpdateHackathonUseCase {

	private final HackathonRepository hackathonRepository;

	public UpdateHackathonUseCase(HackathonRepository hackathonRepository) {
		this.hackathonRepository = hackathonRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @hackathonSecurity.isOwnerOrOrgManager(#cmd.hackathonId(), authentication)")
	public Hackathon execute(Command cmd) {
		Hackathon hackathon = hackathonRepository.findById(cmd.hackathonId())
				.orElseThrow(() -> new GetHackathonsUseCase.HackathonNotFoundException(cmd.hackathonId()));

		hackathon.update(cmd.title(), cmd.description(), cmd.startDate(), cmd.endDate(), cmd.maxTeamSize(),
				cmd.allowedParticipants(), cmd.rules(), cmd.prizes(), cmd.tags(), cmd.bannerUrl());
		return hackathonRepository.save(hackathon);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication)")
	public Hackathon transitionStatus(UUID hackathonId, Hackathon.Status targetStatus) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new GetHackathonsUseCase.HackathonNotFoundException(hackathonId));

		switch (targetStatus) {
			case OPEN -> hackathon.open();
			case RUNNING -> hackathon.start();
			case COMPLETED -> hackathon.complete();
			default -> throw new IllegalArgumentException("Cannot transition to: " + targetStatus);
		}
		return hackathonRepository.save(hackathon);
	}

	public record Command(UUID hackathonId, String title, String description, Instant startDate, Instant endDate,
			int maxTeamSize, int allowedParticipants, String rules, String bannerUrl, List<String> prizes,
			List<String> tags) {
	}
}
