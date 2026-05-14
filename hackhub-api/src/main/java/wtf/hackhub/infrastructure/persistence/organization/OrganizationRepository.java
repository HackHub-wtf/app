package wtf.hackhub.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.Organization;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

	boolean existsBySlug(String slug);

	Optional<Organization> findBySlug(String slug);
}
