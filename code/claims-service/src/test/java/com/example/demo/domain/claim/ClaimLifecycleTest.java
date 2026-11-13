package com.example.demo.domain.claim;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;

class ClaimLifecycleTest {
    private static final Set<String> ALLOWED = Set.of(
            "SUBMITTED>UNDER_REVIEW", "SUBMITTED>REJECTED",
            "UNDER_REVIEW>APPROVED", "UNDER_REVIEW>REJECTED", "UNDER_REVIEW>SUBMITTED",
            "APPROVED>CLOSED", "REJECTED>CLOSED");

    static Stream<Arguments> transitions() {
        return Stream.of(ClaimStatus.values()).flatMap(from -> Stream.of(ClaimStatus.values())
                .map(to -> Arguments.of(from, to, ALLOWED.contains(from + ">" + to))));
    }

    @ParameterizedTest(name = "{0} to {1}: permitted={2}")
    @MethodSource("transitions")
    void enforcesLifecycleAndEmitsEventsOnlyForPermittedChanges(
            ClaimStatus from, ClaimStatus to, boolean permitted) {
        Instant originalTime = Instant.parse("2026-01-01T00:00:00Z");
        Claim claim = Claim.reconstitute(UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2025, 12, 1), "123 Main Street", "Vehicle damaged in collision",
                new BigDecimal("100.00"), from, originalTime, originalTime);
        if (permitted) {
            claim.updateStatus(to);
            assertThat(claim.getStatus()).isEqualTo(to);
            assertThat(claim.getDomainEvents()).hasSize(1);
            var event = (com.example.demo.domain.claim.events.ClaimStatusChanged) claim.getDomainEvents().getFirst();
            assertThat(event.claimId()).isEqualTo(claim.getClaimId());
            assertThat(event.oldStatus()).isEqualTo(from);
            assertThat(event.newStatus()).isEqualTo(to);
        } else {
            assertThatThrownBy(() -> claim.updateStatus(to)).isInstanceOf(InvalidStatusTransitionException.class);
            assertThat(claim.getStatus()).isEqualTo(from);
            assertThat(claim.getUpdatedAt()).isEqualTo(originalTime);
            assertThat(claim.getDomainEvents()).isEmpty();
        }
    }
}
