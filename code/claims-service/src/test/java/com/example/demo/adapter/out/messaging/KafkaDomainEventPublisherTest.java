package com.example.demo.adapter.out.messaging;

import com.example.demo.domain.claim.ClaimStatus;
import com.example.demo.domain.claim.events.ClaimStatusChanged;
import com.example.demo.domain.claim.events.ClaimSubmitted;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KafkaDomainEventPublisherTest {
    @Mock private KafkaTemplate<String, String> kafkaTemplate;
    @Mock private KafkaMessageSchemaValidator schemaValidator;
    private ObjectMapper mapper;
    private KafkaDomainEventPublisher publisher;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        publisher = new KafkaDomainEventPublisher(kafkaTemplate, mapper, schemaValidator);
    }

    @Test
    void publishesSubmissionEnvelopeWithClaimantAndCorrelationId() throws Exception {
        var event = submission();
        publisher.publish(event);

        String json = sentPayload(event.claimId());
        JsonNode envelope = mapper.readTree(json);
        assertThat(envelope.path("eventType").asText()).isEqualTo("claim-submitted");
        assertThat(envelope.path("eventId").asText()).isEqualTo(event.eventId());
        assertThat(envelope.path("payload").path("claimId").asText()).isEqualTo(event.claimId().toString());
        assertThat(envelope.path("payload").path("userId").asText()).isEqualTo(event.userId().toString());
        assertThat(envelope.path("payload").path("correlationId").asText()).isEqualTo(event.eventId());
        verify(schemaValidator).validate(json, "ClaimSubmittedMessage");
    }

    @Test
    void publishesStatusEnvelopeWithOldAndNewStatusAndRecipient() throws Exception {
        var event = statusChange(UUID.randomUUID());
        publisher.publish(event);

        String json = sentPayload(event.claimId());
        JsonNode envelope = mapper.readTree(json);
        assertThat(envelope.path("eventType").asText()).isEqualTo("claim-status-changed");
        assertThat(envelope.path("eventId").asText()).isEqualTo(event.eventId());
        JsonNode payload = envelope.path("payload");
        assertThat(payload.path("claimId").asText()).isEqualTo(event.claimId().toString());
        assertThat(payload.path("oldStatus").asText()).isEqualTo("SUBMITTED");
        assertThat(payload.path("newStatus").asText()).isEqualTo("UNDER_REVIEW");
        assertThat(payload.path("userId").asText()).isEqualTo(event.changedBy().toString());
        assertThat(payload.path("correlationId").asText()).isEqualTo(event.eventId());
        verify(schemaValidator).validate(json, "ClaimStatusChangedMessage");
    }

    @Test
    void omitsRecipientWhenStatusEventHasNoUser() throws Exception {
        var event = statusChange(null);
        publisher.publish(event);
        assertThat(mapper.readTree(sentPayload(event.claimId())).path("payload").has("userId")).isFalse();
    }

    @Test
    void doesNotSendSubmissionWhenSchemaValidatorRejectsEnvelope() {
        var event = submission();
        doThrow(new KafkaMessageValidationException("claimId rejected"))
                .when(schemaValidator).validate(anyString(), eq("ClaimSubmittedMessage"));
        assertThatThrownBy(() -> publisher.publish(event))
                .isInstanceOf(KafkaMessageValidationException.class).hasMessageContaining("claimId");
        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void doesNotSendStatusChangeWhenSchemaValidatorRejectsEnvelope() {
        var event = statusChange(UUID.randomUUID());
        doThrow(new KafkaMessageValidationException("oldStatus rejected"))
                .when(schemaValidator).validate(anyString(), eq("ClaimStatusChangedMessage"));
        assertThatThrownBy(() -> publisher.publish(event))
                .isInstanceOf(KafkaMessageValidationException.class).hasMessageContaining("oldStatus");
        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void doesNotValidateOrSendWhenSerializationFails() throws Exception {
        ObjectMapper failingMapper = spy(new ObjectMapper());
        doThrow(new JsonProcessingException("serialization unavailable") {})
                .when(failingMapper).writeValueAsString(any(ObjectNode.class));
        var failingPublisher = new KafkaDomainEventPublisher(kafkaTemplate, failingMapper, schemaValidator);
        assertThatThrownBy(() -> failingPublisher.publish(submission()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Failed to serialize domain event")
                .hasCauseInstanceOf(JsonProcessingException.class);
        verifyNoInteractions(schemaValidator, kafkaTemplate);
    }

    private String sentPayload(UUID claimId) {
        var captor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(eq("claim-events"), eq(claimId.toString()), captor.capture());
        return captor.getValue();
    }

    private ClaimSubmitted submission() {
        return new ClaimSubmitted("submission-event", UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2026, 1, 1), BigDecimal.TEN, Instant.parse("2026-01-02T00:00:00Z"));
    }

    private ClaimStatusChanged statusChange(UUID recipient) {
        return new ClaimStatusChanged("status-event", UUID.randomUUID(), ClaimStatus.SUBMITTED,
                ClaimStatus.UNDER_REVIEW, recipient, Instant.parse("2026-01-02T00:00:00Z"));
    }
}
