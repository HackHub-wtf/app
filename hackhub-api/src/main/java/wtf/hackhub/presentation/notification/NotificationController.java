package wtf.hackhub.presentation.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.notification.NotificationService;
import wtf.hackhub.domain.Notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Notifications", description = "User notification management")
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@Operation(summary = "List notifications for the authenticated user")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping
	public Page<NotificationResponse> list(@AuthenticationPrincipal UUID userId, Pageable pageable) {
		return notificationService.listForUser(userId, pageable).map(NotificationResponse::from);
	}

	@Operation(summary = "Get the unread notification count for the authenticated user")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/unread-count")
	public Map<String, Long> unreadCount(@AuthenticationPrincipal UUID userId) {
		return Map.of("count", notificationService.countUnread(userId));
	}

	@Operation(summary = "Mark a notification as read")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Marked as read"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Notification not found")})
	@PatchMapping("/{id}/read")
	public NotificationResponse markRead(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		return NotificationResponse.from(notificationService.markRead(id, userId));
	}

	@Operation(summary = "Mark all notifications as read")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "All marked as read"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/read-all")
	public Map<String, Integer> markAllRead(@AuthenticationPrincipal UUID userId) {
		return Map.of("updated", notificationService.markAllRead(userId));
	}

	@Operation(summary = "Delete a notification")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Deleted"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Notification not found")})
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
		notificationService.delete(id, userId);
	}

	public record NotificationResponse(UUID id, UUID userId, String title, String message, String type, boolean read,
			String actionUrl, Instant createdAt) {
		static NotificationResponse from(Notification n) {
			return new NotificationResponse(n.getId(), n.getUserId(), n.getTitle(), n.getMessage(),
					n.getType().name().toLowerCase(), n.isRead(), n.getActionUrl(), n.getCreatedAt());
		}
	}
}
