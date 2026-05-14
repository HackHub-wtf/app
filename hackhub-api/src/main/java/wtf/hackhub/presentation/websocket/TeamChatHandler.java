package wtf.hackhub.presentation.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import wtf.hackhub.infrastructure.persistence.chat.ChatMessageRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;

import java.util.UUID;

/**
 * Client sends to: /app/team.{teamId}.message Server broadcasts:
 * /topic/team.{teamId}.chat
 */
@Controller
public class TeamChatHandler {

	private final SimpMessagingTemplate messaging;
	private final ChatMessageRepository chatRepo;
	private final TeamMemberRepository memberRepo;

	public TeamChatHandler(SimpMessagingTemplate messaging, ChatMessageRepository chatRepo,
			TeamMemberRepository memberRepo) {
		this.messaging = messaging;
		this.chatRepo = chatRepo;
		this.memberRepo = memberRepo;
	}

	@MessageMapping("/team.{teamId}.message")
	public void handleMessage(@DestinationVariable UUID teamId, @Payload SendMessageRequest request,
			@AuthenticationPrincipal UUID userId) {

		if (!memberRepo.existsByTeamIdAndUserId(teamId, userId)) {
			throw new NotTeamMemberException(userId, teamId);
		}

		wtf.hackhub.domain.ChatMessage saved = chatRepo
				.save(new wtf.hackhub.domain.ChatMessage(teamId, userId, request.content(), "text", null, null));

		messaging.convertAndSend("/topic/team." + teamId + ".chat", ChatMessage.from(saved));
	}

	public record SendMessageRequest(String content) {
	}

	public static class NotTeamMemberException extends RuntimeException {
		public NotTeamMemberException(UUID u, UUID t) {
			super("User " + u + " is not a member of team " + t);
		}
	}
}
