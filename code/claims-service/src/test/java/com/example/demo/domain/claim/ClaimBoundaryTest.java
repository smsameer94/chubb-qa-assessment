package com.example.demo.domain.claim;

import com.example.demo.fixtures.ClaimTestBuilder;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class ClaimBoundaryTest {
    @ParameterizedTest
    @ValueSource(strings = {"0.01", "1000000.00"})
    void acceptsAmountsAtSupportedBoundaries(String amount) {
        Claim claim = ClaimTestBuilder.aClaim().withClaimAmount(new BigDecimal(amount)).build();
        assertThat(claim.getClaimAmount()).isEqualByComparingTo(amount);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-0.01", "1000000.01"})
    void rejectsAmountsOutsideSupportedBoundaries(String amount) {
        assertThatThrownBy(() -> ClaimTestBuilder.aClaim().withClaimAmount(new BigDecimal(amount)).build())
                .isInstanceOf(InvalidClaimException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {10, 1000})
    void acceptsDescriptionsAtLengthBoundaries(int length) {
        Claim claim = ClaimTestBuilder.aClaim().withDescription("x".repeat(length)).build();
        assertThat(claim.getDescription()).hasSize(length);
    }

    @ParameterizedTest
    @ValueSource(ints = {9, 1001})
    void rejectsDescriptionsOutsideLengthBoundaries(int length) {
        assertThatThrownBy(() -> ClaimTestBuilder.aClaim().withDescription("x".repeat(length)).build())
                .isInstanceOf(InvalidClaimException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 200})
    void acceptsLocationsAtLengthBoundaries(int length) {
        Claim claim = ClaimTestBuilder.aClaim().withIncidentLocation("x".repeat(length)).build();
        assertThat(claim.getIncidentLocation()).hasSize(length);
    }

    @ParameterizedTest
    @ValueSource(ints = {4, 201})
    void rejectsLocationsOutsideLengthBoundaries(int length) {
        assertThatThrownBy(() -> ClaimTestBuilder.aClaim().withIncidentLocation("x".repeat(length)).build())
                .isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void validatesDescriptionAfterTrimmingWhitespace() {
        assertThatThrownBy(() -> ClaimTestBuilder.aClaim().withDescription("     short     ").build())
                .isInstanceOf(InvalidClaimException.class);
    }

    @Test
    void rejectedTransitionLeavesStatusTimestampAndEventsUnchanged() {
        Claim claim = ClaimTestBuilder.aClaim().build();
        claim.clearEvents();
        var updatedAt = claim.getUpdatedAt();
        assertThatThrownBy(() -> claim.updateStatus(ClaimStatus.APPROVED))
                .isInstanceOf(InvalidStatusTransitionException.class);
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.SUBMITTED);
        assertThat(claim.getUpdatedAt()).isEqualTo(updatedAt);
        assertThat(claim.getDomainEvents()).isEmpty();
    }
}
