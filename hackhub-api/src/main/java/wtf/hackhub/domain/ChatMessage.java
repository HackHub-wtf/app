package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "team_id", nullable = false)
	private UUID teamId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	@Column(name = "message_type", nullable = false)
	private String messageType = "text";

	@Column(name = "file_url")
	private String fileUrl;

	@Column(name = "file_name")
	private String fileName;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	protected ChatMessage() {
	}

	public ChatMessage(UUID teamId, UUID userId, String content, String messageType, String fileUrl, String fileName) {
		this.teamId = teamId;
		this.userId = userId;
		this.content = content;
		this.messageType = messageType;
		this.fileUrl = fileUrl;
		this.fileName = fileName;
	}

	public UUID getId() {
		return id;
	}
	public UUID getTeamId() {
		return teamId;
	}
	public UUID getUserId() {
		return userId;
	}
	public String getContent() {
		return content;
	}
	public String getMessageType() {
		return messageType;
	}
	public String getFileUrl() {
		return fileUrl;
	}
	public String getFileName() {
		return fileName;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
}
