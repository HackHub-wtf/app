package wtf.hackhub.application.idea;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import wtf.hackhub.application.hackathon.CreateHackathonUseCase;
import wtf.hackhub.application.hackathon.UpdateHackathonUseCase;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.support.PostgresIntegrationTest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdeaFlowIT extends PostgresIntegrationTest {

	@Autowired
	CreateHackathonUseCase createHackathon;
	@Autowired
	UpdateHackathonUseCase updateHackathon;
	@Autowired
	SubmitIdeaUseCase submitIdea;
	@Autowired
	GetIdeasUseCase getIdeas;
	@Autowired
	VoteIdeaUseCase voteIdea;
	@Autowired
	CommentUseCase commentUseCase;

	UUID creatorId;
	UUID hackathonId;

	@BeforeEach
	void setup() {
		creatorId = UUID.fromString(insertProfile("creator@test.com", "Creator", "manager"));
		var cmd = new CreateHackathonUseCase.Command("Idea Hack", "desc", Instant.now(),
				Instant.now().plusSeconds(86400), 4, 100, creatorId, null, List.of(), List.of());
		Hackathon h = createHackathon.execute(cmd);
		updateHackathon.transitionStatus(h.getId(), Hackathon.Status.OPEN);
		updateHackathon.transitionStatus(h.getId(), Hackathon.Status.RUNNING);
		hackathonId = h.getId();
	}

	@Test
	void submit_and_retrieve_idea() {
		Idea idea = submitIdea.execute("My Idea", "Great concept", hackathonId, null, creatorId, "AI", List.of("ml"));

		assertThat(idea.getId()).isNotNull();
		assertThat(idea.getTitle()).isEqualTo("My Idea");
		assertThat(idea.getStatus()).isEqualTo(Idea.Status.DRAFT);

		Idea fetched = getIdeas.getById(idea.getId());
		assertThat(fetched.getTitle()).isEqualTo("My Idea");
	}

	@Test
	void vote_toggles_on_and_off() {
		Idea idea = submitIdea.execute("Vote Me", "desc", hackathonId, null, creatorId, "Tech", List.of());

		UUID voter = UUID.fromString(insertProfile("voter@test.com", "Voter", "participant"));

		VoteIdeaUseCase.Result first = voteIdea.execute(idea.getId(), voter);
		assertThat(first.voted()).isTrue();
		assertThat(first.voteCount()).isEqualTo(1);

		VoteIdeaUseCase.Result second = voteIdea.execute(idea.getId(), voter);
		assertThat(second.voted()).isFalse();
		assertThat(second.voteCount()).isEqualTo(0);
	}

	@Test
	void add_and_list_comments() {
		Idea idea = submitIdea.execute("Comment Me", "desc", hackathonId, null, creatorId, "UX", List.of());
		UUID commenter = UUID.fromString(insertProfile("comm@test.com", "Comm", "participant"));

		commentUseCase.add(idea.getId(), commenter, "Looks good!");
		commentUseCase.add(idea.getId(), creatorId, "Thanks!");

		var comments = commentUseCase.listForIdea(idea.getId());
		assertThat(comments).hasSize(2);
		assertThat(comments.get(0).getContent()).isEqualTo("Looks good!");
	}

	@Test
	void non_owner_cannot_update_idea() {
		Idea idea = submitIdea.execute("Protected", "desc", hackathonId, null, creatorId, "Tech", List.of());
		UUID intruder = UUID.fromString(insertProfile("intruder@test.com", "Bad", "participant"));

		assertThatThrownBy(() -> submitIdea.update(idea.getId(), intruder, "Hijacked", "d", "Tech", List.of(),
				Idea.Status.SUBMITTED, null, null, null))
				.isInstanceOf(SubmitIdeaUseCase.IdeaAccessDeniedException.class);
	}

	@Test
	void list_ideas_for_hackathon() {
		submitIdea.execute("Idea A", "d", hackathonId, null, creatorId, "AI", List.of());
		submitIdea.execute("Idea B", "d", hackathonId, null, creatorId, "Web", List.of());

		var page = getIdeas.listByHackathon(hackathonId, org.springframework.data.domain.Pageable.unpaged());
		assertThat(page.getTotalElements()).isEqualTo(2);
	}
}
