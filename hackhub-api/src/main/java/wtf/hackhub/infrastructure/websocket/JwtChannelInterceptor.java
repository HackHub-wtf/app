package wtf.hackhub.infrastructure.websocket;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import wtf.hackhub.infrastructure.security.JwtProvider;

import java.util.List;
import java.util.UUID;

/**
 * Validates JWT on STOMP CONNECT frames. Rejects connections without a valid
 * Bearer token. Populates the STOMP session principal
 * so @AuthenticationPrincipal works in handlers.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

	private final JwtProvider jwtProvider;

	public JwtChannelInterceptor(JwtProvider jwtProvider) {
		this.jwtProvider = jwtProvider;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

		if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
			return message;
		}

		String authHeader = accessor.getFirstNativeHeader("Authorization");
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			throw new IllegalArgumentException("Missing or invalid Authorization header on CONNECT");
		}

		String token = authHeader.substring(7);
		try {
			Claims claims = jwtProvider.validateAndExtract(token);
			UUID userId = jwtProvider.extractUserId(claims);
			String role = jwtProvider.extractRole(claims);

			var auth = new UsernamePasswordAuthenticationToken(userId, null,
					List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())));
			accessor.setUser(auth);
		} catch (JwtException e) {
			throw new IllegalArgumentException("Invalid JWT on WebSocket CONNECT: " + e.getMessage());
		}

		return message;
	}
}
