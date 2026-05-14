package wtf.hackhub.infrastructure.persistence.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.Profile;

import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

	Optional<Profile> findByEmail(String email);

	boolean existsByEmail(String email);
}
