package wtf.hackhub.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.OrganizationMember;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {

	List<OrganizationMember> findAllByOrganizationId(UUID organizationId);

	Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);

	boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);

	Optional<OrganizationMember> findFirstByUserId(UUID userId);

	List<OrganizationMember> findAllByUserId(UUID userId);

	long countByOrganizationId(UUID organizationId);
}
