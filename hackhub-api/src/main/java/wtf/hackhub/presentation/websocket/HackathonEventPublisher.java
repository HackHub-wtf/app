package wtf.hackhub.presentation.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Publishes hackathon-scoped events to STOMP subscribers. Injected into use
 * cases that need to broadcast state changes.
 *
 * Subscriptions: /topic/hackathon.{hackathonId}.updates — new teams, ideas,
 * vote changes /user/queue/notifications — per-user notification delivery
 */
@Component
public class HackathonEventPublisher {

	private final SimpMessagingTemplate messaging;

	public HackathonEventPublisher(SimpMessagingTemplate messaging) {
		this.messaging = messaging;
	}

	public void publishTeamCreated(UUID hackathonId, UUID teamId, String teamName) {
		messaging.convertAndSend("/topic/hackathon." + hackathonId + ".updates",
				Map.of("event", "TEAM_CREATED", "teamId", teamId, "teamName", teamName));
	}

	public void publishIdeaSubmitted(UUID hackathonId, UUID ideaId, String ideaTitle) {
		messaging.convertAndSend("/topic/hackathon." + hackathonId + ".updates",
				Map.of("event", "IDEA_SUBMITTED", "ideaId", ideaId, "ideaTitle", ideaTitle));
	}

	public void publishVoteUpdate(UUID hackathonId, UUID ideaId, long voteCount) {
		messaging.convertAndSend("/topic/hackathon." + hackathonId + ".updates",
				Map.of("event", "VOTE_UPDATED", "ideaId", ideaId, "voteCount", voteCount));
	}

	public void notifyUser(String username, String title, String message, String actionUrl) {
		messaging.convertAndSendToUser(username, "/queue/notifications",
				Map.of("title", title, "message", message, "actionUrl", actionUrl));
	}
}
