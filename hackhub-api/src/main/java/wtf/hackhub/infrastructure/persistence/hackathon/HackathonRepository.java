package wtf.hackhub.infrastructure.persistence.hackathon;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wtf.hackhub.domain.Hackathon;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface HackathonRepository extends JpaRepository<Hackathon, UUID> {

	Page<Hackathon> findAllByOrderByCreatedAtDesc(Pageable pageable);

	Page<Hackathon> findByStatusOrderByCreatedAtDesc(Hackathon.Status status, Pageable pageable);

	/** Org-scoped listing: returns hackathons whose organizationId is in the provided set. */
	@Query("SELECT h FROM Hackathon h WHERE h.organizationId IN :orgIds ORDER BY h.createdAt DESC")
	Page<Hackathon> findByOrganizationIdInOrderByCreatedAtDesc(
			@Param("orgIds") Collection<UUID> orgIds, Pageable pageable);

	Optional<Hackathon> findByRegistrationKey(String registrationKey);

	boolean existsByRegistrationKey(String registrationKey);

	long countByOrganizationId(UUID organizationId);
}
