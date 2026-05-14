package wtf.hackhub.presentation.websocket;

import java.time.Instant;
import java.util.UUID;

/** STOMP payload broadcast to /topic/team.{id}.chat */
public record ChatMessage(UUID id, UUID teamId, UUID userId, String content, String messageType, String fileUrl,
		String fileName, Instant createdAt) {
	public static ChatMessage from(wtf.hackhub.domain.ChatMessage e) {
		return new ChatMessage(e.getId(), e.getTeamId(), e.getUserId(), e.getContent(), e.getMessageType(),
				e.getFileUrl(), e.getFileName(), e.getCreatedAt());
	}
}
