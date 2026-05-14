package wtf.hackhub.infrastructure.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import wtf.hackhub.infrastructure.config.AppProperties;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final JwtChannelInterceptor jwtChannelInterceptor;
	private final AppProperties properties;

	public WebSocketConfig(JwtChannelInterceptor jwtChannelInterceptor, AppProperties properties) {
		this.jwtChannelInterceptor = jwtChannelInterceptor;
		this.properties = properties;
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// In-memory broker for topic and user queues
		registry.enableSimpleBroker("/topic", "/queue");
		// Prefix for client → server messages
		registry.setApplicationDestinationPrefixes("/app");
		// Prefix for server → specific user messages
		registry.setUserDestinationPrefix("/user");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws")
				.setAllowedOriginPatterns(properties.cors().allowedOriginsList().toArray(new String[0])).withSockJS();
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		// JWT authentication on every CONNECT frame
		registration.interceptors(jwtChannelInterceptor);
	}
}
