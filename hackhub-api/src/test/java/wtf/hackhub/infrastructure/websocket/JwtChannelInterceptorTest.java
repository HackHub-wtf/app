package wtf.hackhub.infrastructure.websocket;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtChannelInterceptorTest {

	@Mock
	wtf.hackhub.infrastructure.security.JwtProvider jwtProvider;
	@Mock
	MessageChannel channel;
	@InjectMocks
	JwtChannelInterceptor interceptor;

	private Message<?> connectMessage(String authHeader) {
		StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
		if (authHeader != null)
			accessor.addNativeHeader("Authorization", authHeader);
		accessor.setLeaveMutable(true);
		return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
	}

	@Test
	void valid_jwt_on_connect_sets_principal() {
		UUID userId = UUID.randomUUID();
		Claims claims = new DefaultClaims(Map.of("sub", userId.toString(), "role", "participant"));

		when(jwtProvider.validateAndExtract("valid.token")).thenReturn(claims);
		when(jwtProvider.extractUserId(claims)).thenReturn(userId);
		when(jwtProvider.extractRole(claims)).thenReturn("participant");

		Message<?> result = interceptor.preSend(connectMessage("Bearer valid.token"), channel);

		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
		assertThat(accessor.getUser()).isNotNull();
		assertThat(accessor.getUser().getName()).isEqualTo(userId.toString());
	}

	@Test
	void missing_auth_header_throws() {
		assertThatThrownBy(() -> interceptor.preSend(connectMessage(null), channel))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Missing or invalid Authorization header");
	}

	@Test
	void invalid_jwt_throws() {
		when(jwtProvider.validateAndExtract("bad.token")).thenThrow(new io.jsonwebtoken.JwtException("expired"));

		assertThatThrownBy(() -> interceptor.preSend(connectMessage("Bearer bad.token"), channel))
				.isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Invalid JWT");
	}

	@Test
	void non_connect_frames_pass_through_unchanged() {
		StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
		accessor.setLeaveMutable(true);
		Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

		Message<?> result = interceptor.preSend(msg, channel);

		assertThat(result).isSameAs(msg);
		verifyNoInteractions(jwtProvider);
	}
}
