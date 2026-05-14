package wtf.hackhub.infrastructure.persistence.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.ChatMessage;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
	List<ChatMessage> findByTeamIdOrderByCreatedAtAsc(UUID teamId, Pageable pageable);
}
