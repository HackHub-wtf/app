package wtf.hackhub.application.hackathon;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.support.PostgresIntegrationTest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HackathonLifecycleIT extends PostgresIntegrationTest {

	@Autowired
	CreateHackathonUseCase createUseCase;
	@Autowired
	GetHackathonsUseCase getUseCase;
	@Autowired
	UpdateHackathonUseCase updateUseCase;
	@Autowired
	JoinHackathonUseCase joinUseCase;

	@Test
	void create_and_retrieve_hackathon() {
		String creatorId = insertProfile("mgr@test.com", "Mgr", "manager");

		var cmd = new CreateHackathonUseCase.Command("Spring Hack", "Annual hackathon",
				Instant.parse("2026-06-01T00:00:00Z"), Instant.parse("2026-06-03T00:00:00Z"), 4, 100,
				UUID.fromString(creatorId), null, List.of("AI", "Web"), List.of("$1000"));

		Hackathon created = createUseCase.execute(cmd);

		assertThat(created.getId()).isNotNull();
		assertThat(created.getTitle()).isEqualTo("Spring Hack");
		assertThat(created.getRegistrationKey()).hasSize(12);
		assertThat(created.getStatus()).isEqualTo(Hackathon.Status.DRAFT);

		Hackathon fetched = getUseCase.getById(created.getId());
		assertThat(fetched.getTitle()).isEqualTo("Spring Hack");
	}

	@Test
	void status_transition_draft_to_open_to_running_to_completed() {
		String creatorId = insertProfile("admin@test.com", "Admin", "admin");
		var cmd = new CreateHackathonUseCase.Command("Lifecycle Hack", "desc", Instant.now(),
				Instant.now().plusSeconds(86400), 4, 50, UUID.fromString(creatorId), null, List.of(), List.of());

		Hackathon h = createUseCase.execute(cmd);
		UUID id = h.getId();

		Hackathon opened = updateUseCase.transitionStatus(id, Hackathon.Status.OPEN);
		assertThat(opened.getStatus()).isEqualTo(Hackathon.Status.OPEN);

		Hackathon running = updateUseCase.transitionStatus(id, Hackathon.Status.RUNNING);
		assertThat(running.getStatus()).isEqualTo(Hackathon.Status.RUNNING);

		Hackathon completed = updateUseCase.transitionStatus(id, Hackathon.Status.COMPLETED);
		assertThat(completed.getStatus()).isEqualTo(Hackathon.Status.COMPLETED);
	}

	@Test
	void invalid_transition_draft_to_running_throws() {
		String creatorId = insertProfile("admin2@test.com", "Admin2", "admin");
		var cmd = new CreateHackathonUseCase.Command("Bad Transition", "desc", Instant.now(),
				Instant.now().plusSeconds(86400), 4, 50, UUID.fromString(creatorId), null, List.of(), List.of());

		Hackathon h = createUseCase.execute(cmd);

		// DRAFT → RUNNING is invalid (must go through OPEN first)
		assertThatThrownBy(() -> updateUseCase.transitionStatus(h.getId(), Hackathon.Status.RUNNING))
				.isInstanceOf(Hackathon.InvalidTransitionException.class);
	}

	@Test
	void participant_can_join_open_hackathon() {
		String creatorId = insertProfile("mgr2@test.com", "Mgr2", "manager");
		String participantId = insertProfile("p@test.com", "Participant", "participant");

		var cmd = new CreateHackathonUseCase.Command("Join Test Hack", "desc", Instant.now(),
				Instant.now().plusSeconds(86400), 4, 50, UUID.fromString(creatorId), null, List.of(), List.of());
		Hackathon h = createUseCase.execute(cmd);
		updateUseCase.transitionStatus(h.getId(), Hackathon.Status.OPEN);

		Hackathon joined = joinUseCase.execute(h.getRegistrationKey());
		assertThat(joined.getId()).isEqualTo(h.getId());
	}

	@Test
	void join_with_invalid_key_throws() {
		assertThatThrownBy(() -> joinUseCase.execute("BADKEYXXX"))
				.isInstanceOf(JoinHackathonUseCase.InvalidRegistrationKeyException.class);
	}

	@Test
	void get_by_id_not_found_throws() {
		assertThatThrownBy(() -> getUseCase.getById(UUID.randomUUID()))
				.isInstanceOf(GetHackathonsUseCase.HackathonNotFoundException.class);
	}
}
