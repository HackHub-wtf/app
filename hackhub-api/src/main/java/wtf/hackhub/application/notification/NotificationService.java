package wtf.hackhub.application.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Notification;
import wtf.hackhub.infrastructure.persistence.notification.NotificationRepository;

import java.util.UUID;

@Service
public class NotificationService {

	private final NotificationRepository repository;

	public NotificationService(NotificationRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Page<Notification> listForUser(UUID userId, Pageable pageable) {
		return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
	}

	@Transactional(readOnly = true)
	public long countUnread(UUID userId) {
		return repository.countByUserIdAndReadFalse(userId);
	}

	@Transactional
	public Notification create(UUID userId, String title, String message, Notification.Type type, String actionUrl) {
		return repository.save(new Notification(userId, title, message, type, actionUrl));
	}

	@Transactional
	public Notification markRead(UUID notificationId, UUID requestingUserId) {
		Notification n = repository.findById(notificationId)
				.orElseThrow(() -> new NotificationNotFoundException(notificationId));
		if (!n.getUserId().equals(requestingUserId)) {
			throw new NotificationAccessDeniedException(notificationId, requestingUserId);
		}
		n.markRead();
		return repository.save(n);
	}

	@Transactional
	public int markAllRead(UUID userId) {
		return repository.markAllReadForUser(userId);
	}

	@Transactional
	public void delete(UUID notificationId, UUID requestingUserId) {
		Notification n = repository.findById(notificationId)
				.orElseThrow(() -> new NotificationNotFoundException(notificationId));
		if (!n.getUserId().equals(requestingUserId)) {
			throw new NotificationAccessDeniedException(notificationId, requestingUserId);
		}
		repository.delete(n);
	}

	public static class NotificationNotFoundException extends RuntimeException {
		public NotificationNotFoundException(UUID id) {
			super("Notification not found: " + id);
		}
	}

	public static class NotificationAccessDeniedException extends RuntimeException {
		public NotificationAccessDeniedException(UUID id, UUID userId) {
			super("User " + userId + " does not own notification " + id);
		}
	}
}
