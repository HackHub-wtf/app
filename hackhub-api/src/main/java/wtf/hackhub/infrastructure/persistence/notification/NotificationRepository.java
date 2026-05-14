package wtf.hackhub.infrastructure.persistence.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import wtf.hackhub.domain.Notification;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

	Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

	long countByUserIdAndReadFalse(UUID userId);

	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
	int markAllReadForUser(UUID userId);
}
