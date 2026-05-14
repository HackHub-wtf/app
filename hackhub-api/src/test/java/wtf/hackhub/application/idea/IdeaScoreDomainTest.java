package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import wtf.hackhub.domain.IdeaScore;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdeaScoreDomainTest {

	@Test
	void score_1_is_valid() {
		IdeaScore s = new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1);
		assertThat(s.getScore()).isEqualTo(1);
	}

	@Test
	void score_10_is_valid() {
		IdeaScore s = new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 10);
		assertThat(s.getScore()).isEqualTo(10);
	}

	@Test
	void score_0_is_invalid() {
		assertThatThrownBy(() -> new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 0))
				.isInstanceOf(IdeaScore.InvalidScoreException.class);
	}

	@Test
	void score_11_is_invalid() {
		assertThatThrownBy(() -> new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 11))
				.isInstanceOf(IdeaScore.InvalidScoreException.class);
	}

	@Test
	void update_score_within_range_succeeds() {
		IdeaScore s = new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 5);
		s.updateScore(8);
		assertThat(s.getScore()).isEqualTo(8);
	}

	@Test
	void update_score_out_of_range_throws() {
		IdeaScore s = new IdeaScore(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 5);
		assertThatThrownBy(() -> s.updateScore(0)).isInstanceOf(IdeaScore.InvalidScoreException.class);
	}
}
