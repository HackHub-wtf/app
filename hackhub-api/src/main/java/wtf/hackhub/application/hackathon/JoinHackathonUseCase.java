package wtf.hackhub.application.hackathon;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

@Service
public class JoinHackathonUseCase {

	private final HackathonRepository hackathonRepository;

	public JoinHackathonUseCase(HackathonRepository hackathonRepository) {
		this.hackathonRepository = hackathonRepository;
	}

	@Transactional
	public Hackathon execute(String registrationKey) {
		Hackathon hackathon = hackathonRepository.findByRegistrationKey(registrationKey)
				.orElseThrow(() -> new InvalidRegistrationKeyException(registrationKey));

		if (hackathon.getStatus() != Hackathon.Status.OPEN) {
			throw new HackathonNotOpenException(hackathon.getId(), hackathon.getStatus());
		}

		hackathon.incrementParticipants();
		return hackathonRepository.save(hackathon);
	}

	public static class InvalidRegistrationKeyException extends RuntimeException {
		public InvalidRegistrationKeyException(String key) {
			super("Invalid registration key: " + key);
		}
	}

	public static class HackathonNotOpenException extends RuntimeException {
		public HackathonNotOpenException(java.util.UUID id, Hackathon.Status status) {
			super("Hackathon " + id + " is not open for registration (status: " + status + ")");
		}
	}
}
