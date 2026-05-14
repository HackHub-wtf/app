package wtf.hackhub.presentation.organization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrgRequest(@NotBlank @Size(min = 2, max = 100) String name,
		@NotBlank @Pattern(regexp = "^[a-z0-9-]+$", message = "slug must be lowercase alphanumeric with hyphens") @Size(min = 2, max = 50) String slug) {
}
