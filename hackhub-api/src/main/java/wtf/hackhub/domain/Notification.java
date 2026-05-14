package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, columnDefinition = "text")
	private String message;

	@Convert(converter = Type.TypeConverter.class)
	@Column(nullable = false)
	private Type type = Type.INFO;

	@Column(name = "is_read", nullable = false)
	private boolean read = false;

	@Column(name = "action_url")
	private String actionUrl;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	public enum Type {
		INFO, SUCCESS, WARNING, ERROR;

		@jakarta.persistence.Converter(autoApply = true)
		public static class TypeConverter implements jakarta.persistence.AttributeConverter<Type, String> {
			@Override
			public String convertToDatabaseColumn(Type type) {
				return type == null ? null : type.name().toLowerCase();
			}

			@Override
			public Type convertToEntityAttribute(String value) {
				return value == null ? null : valueOf(value.toUpperCase());
			}
		}
	}

	protected Notification() {
	}

	public Notification(UUID userId, String title, String message, Type type, String actionUrl) {
		this.userId = userId;
		this.title = title;
		this.message = message;
		this.type = type;
		this.actionUrl = actionUrl;
	}

	public void markRead() {
		this.read = true;
	}

	public UUID getId() {
		return id;
	}
	public UUID getUserId() {
		return userId;
	}
	public String getTitle() {
		return title;
	}
	public String getMessage() {
		return message;
	}
	public Type getType() {
		return type;
	}
	public boolean isRead() {
		return read;
	}
	public String getActionUrl() {
		return actionUrl;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
}
