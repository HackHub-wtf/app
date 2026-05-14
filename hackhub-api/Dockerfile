# Multi-stage build — builder + minimal JRE runtime

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Layer dependency resolution separately for better cache hits
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw

# Download deps (cached layer — only re-runs when pom.xml changes)
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw dependency:go-offline -q

COPY src ./src

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw package -DskipTests -DskipSpotlessCheck -q

# Extract layered jar for faster subsequent image rebuilds
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S hackhub && adduser -S hackhub -G hackhub
USER hackhub

WORKDIR /app

COPY --from=builder --chown=hackhub:hackhub /build/target/extracted/dependencies/ ./
COPY --from=builder --chown=hackhub:hackhub /build/target/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=hackhub:hackhub /build/target/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=hackhub:hackhub /build/target/extracted/application/ ./

EXPOSE 8080 8081

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8081/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "org.springframework.boot.loader.launch.JarLauncher"]
