package wtf.hackhub.presentation.chat;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.domain.ChatMessage;
import wtf.hackhub.infrastructure.persistence.chat.ChatMessageRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Chat", description = "Team chat message history")
@RestController
@RequestMapping("/api/v1/teams/{teamId}/messages")
public class ChatController {

	private final ChatMessageRepository chatMessageRepository;
	private final TeamMemberRepository teamMemberRepository;

	public ChatController(ChatMessageRepository chatMessageRepository, TeamMemberRepository teamMemberRepository) {
		this.chatMessageRepository = chatMessageRepository;
		this.teamMemberRepository = teamMemberRepository;
	}

	@Operation(summary = "List chat messages for a team")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Team not found")})
	@GetMapping
	public List<MessageResponse> list(@PathVariable UUID teamId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return chatMessageRepository.findByTeamIdOrderByCreatedAtAsc(teamId, PageRequest.of(page, size)).stream()
				.map(MessageResponse::from).toList();
	}

	public record MessageResponse(UUID id, UUID teamId, UUID userId, String content, String messageType, String fileUrl,
			String fileName, Instant createdAt) {
		static MessageResponse from(ChatMessage m) {
			return new MessageResponse(m.getId(), m.getTeamId(), m.getUserId(), m.getContent(), m.getMessageType(),
					m.getFileUrl(), m.getFileName(), m.getCreatedAt());
		}
	}
}
