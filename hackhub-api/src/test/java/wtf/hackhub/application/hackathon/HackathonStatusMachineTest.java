package wtf.hackhub.application.hackathon;

import org.junit.jupiter.api.Test;
import wtf.hackhub.domain.Hackathon;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HackathonStatusMachineTest {

	private Hackathon hackathon() {
		return new Hackathon("Test", "Desc", Instant.now(), Instant.now().plusSeconds(86400), "REGKEY001", 4, 100,
				UUID.randomUUID(), null);
	}

	@Test
	void initial_status_is_draft() {
		assertThat(hackathon().getStatus()).isEqualTo(Hackathon.Status.DRAFT);
	}

	@Test
	void draft_can_open() {
		Hackathon h = hackathon();
		h.open();
		assertThat(h.getStatus()).isEqualTo(Hackathon.Status.OPEN);
	}

	@Test
	void open_can_start() {
		Hackathon h = hackathon();
		h.open();
		h.start();
		assertThat(h.getStatus()).isEqualTo(Hackathon.Status.RUNNING);
	}

	@Test
	void running_can_complete() {
		Hackathon h = hackathon();
		h.open();
		h.start();
		h.complete();
		assertThat(h.getStatus()).isEqualTo(Hackathon.Status.COMPLETED);
	}

	@Test
	void cannot_open_already_open_hackathon() {
		Hackathon h = hackathon();
		h.open();
		assertThatThrownBy(h::open).isInstanceOf(Hackathon.InvalidTransitionException.class);
	}

	@Test
	void cannot_start_from_draft() {
		Hackathon h = hackathon();
		assertThatThrownBy(h::start).isInstanceOf(Hackathon.InvalidTransitionException.class);
	}

	@Test
	void cannot_complete_from_open() {
		Hackathon h = hackathon();
		h.open();
		assertThatThrownBy(h::complete).isInstanceOf(Hackathon.InvalidTransitionException.class);
	}

	@Test
	void increment_participants_up_to_limit() {
		Hackathon h = new Hackathon("T", "D", Instant.now(), Instant.now().plusSeconds(100), "KEY", 4, 2,
				UUID.randomUUID(), null);
		h.incrementParticipants();
		h.incrementParticipants();
		assertThat(h.getCurrentParticipants()).isEqualTo(2);
	}

	@Test
	void cannot_exceed_capacity() {
		Hackathon h = new Hackathon("T", "D", Instant.now(), Instant.now().plusSeconds(100), "KEY", 4, 1,
				UUID.randomUUID(), null);
		h.incrementParticipants();
		assertThatThrownBy(h::incrementParticipants).isInstanceOf(Hackathon.FullCapacityException.class);
	}
}
