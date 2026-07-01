// event_schedule.h — deterministic event schedule from SEED_MASTER (HARNESS-SPEC §2).
//
// Produces a vector of (block, freq) events from SEED_MASTER via SplitMix64.
// Frozen to schedule.json. Enforces boundary sentinels:
//   - At least one event in [0, K_XFADE_START)
//   - No event in [A_PRE_START, K_XFADE_START) (= pure A pre-window)
//   - A change strictly before K_SWAP (= A changes freq before swap)
//   - No event in [K_SWAP, K_SWAP+P_MEAS) (= pure B post-window)
//   - At least one event after B_POST_END
#pragma once

#include <cstdint>
#include <vector>
#include <string>
#include <utility>

namespace g1a {

// A single frequency-change event: set input value `freq` Hz at the start of `block`.
struct FreqEvent {
    uint32_t block;   // block index (0-based)
    double   freq;    // frequency value in Hz
};

// Event schedule with sentinel validation.
struct EventSchedule {
    std::vector<FreqEvent> events;  // sorted by block

    // Audit counts
    uint64_t events_scheduled_in_0_KSWAP  = 0;  // [0, K_SWAP)
    uint64_t events_scheduled_in_KXFADE_KSWAP = 0;  // [K_XFADE_START, K_SWAP)
    uint64_t events_scheduled_in_KSWAP_N  = 0;  // [K_SWAP, N)

    // Sentinel checks
    bool sentinel_at_least_one_in_0_KXFADE  = false;
    bool sentinel_no_change_in_APRE         = false;
    bool sentinel_change_strictly_before_KSWAP = false;
    bool sentinel_no_change_in_BPOST        = false;
    bool sentinel_at_least_one_after_BPOST  = false;

    // State queries
    double stateAt(uint32_t block) const;  // frequency active at given block

    // Events scheduled in [lo, hi) block range
    uint64_t eventsInRange(uint32_t lo, uint32_t hi) const;
};

// Generate the deterministic event schedule from SEED_MASTER.
// Resamples until all sentinel constraints are met.
EventSchedule generateEventSchedule(uint64_t seedMaster);

// Compute SHA-256 of the schedule JSON for proof artifact.
std::string scheduleJson(const EventSchedule& sched, uint64_t seedMaster);

} // namespace g1a
