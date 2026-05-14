package wtf.hackhub.application.notification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Notification;
import wtf.hackhub.infrastructure.persistence.notification.NotificationRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

	@Mock
	NotificationRepository repository;
	@InjectMocks
	NotificationService service;

	@Test
	void mark_read_flips_read_flag() {
		UUID userId = UUID.randomUUID();
		UUID notifId = UUID.randomUUID();
		Notification n = new Notification(userId, "Title", "Msg", Notification.Type.INFO, null);

		when(repository.findById(notifId)).thenReturn(Optional.of(n));
		when(repository.save(n)).thenReturn(n);

		Notification result = service.markRead(notifId, userId);

		assertThat(result.isRead()).isTrue();
		verify(repository).save(n);
	}

	@Test
	void mark_read_throws_if_wrong_user() {
		UUID ownerId = UUID.randomUUID();
		UUID otherId = UUID.randomUUID();
		UUID notifId = UUID.randomUUID();
		Notification n = new Notification(ownerId, "T", "M", Notification.Type.INFO, null);

		when(repository.findById(notifId)).thenReturn(Optional.of(n));

		assertThatThrownBy(() -> service.markRead(notifId, otherId))
				.isInstanceOf(NotificationService.NotificationAccessDeniedException.class);
		verify(repository, never()).save(any());
	}

	@Test
	void delete_removes_notification() {
		UUID userId = UUID.randomUUID();
		UUID notifId = UUID.randomUUID();
		Notification n = new Notification(userId, "T", "M", Notification.Type.SUCCESS, null);

		when(repository.findById(notifId)).thenReturn(Optional.of(n));

		service.delete(notifId, userId);
		verify(repository).delete(n);
	}

	@Test
	void delete_throws_if_wrong_user() {
		UUID ownerId = UUID.randomUUID();
		UUID notifId = UUID.randomUUID();
		Notification n = new Notification(ownerId, "T", "M", Notification.Type.WARNING, null);

		when(repository.findById(notifId)).thenReturn(Optional.of(n));

		assertThatThrownBy(() -> service.delete(notifId, UUID.randomUUID()))
				.isInstanceOf(NotificationService.NotificationAccessDeniedException.class);
		verify(repository, never()).delete(any());
	}

	@Test
	void create_persists_notification() {
		UUID userId = UUID.randomUUID();
		when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

		Notification result = service.create(userId, "Welcome", "Hello!", Notification.Type.INFO, null);

		assertThat(result.getTitle()).isEqualTo("Welcome");
		assertThat(result.getUserId()).isEqualTo(userId);
		assertThat(result.isRead()).isFalse();
	}
}
