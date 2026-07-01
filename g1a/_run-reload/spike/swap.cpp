// swap.cpp — the post-crossfade safe-release protocol (RELOAD-GROUNDING §3).
#include "swap.h"
#include "host_config.h"

namespace g1a {

void safeReleaseOldPerformer(ReloadState& st)
{
    // Gate (RELOAD-GROUNDING §3): release ONLY after
    //   (i)  the crossfade window has fully elapsed (block >= K_SWAP), AND
    //   (ii) the RT thread has performed at least one load(acquire) == 1.
    const bool rtMovedToNew = st.rtSawIndexOne.load(std::memory_order_acquire);
    const uint32_t confirmBlock = st.rtConfirmedIndexOneBlock;

    // The release point is the gate point: the first block (>= K_SWAP) at which
    // the RT thread provably no longer references performers[0]. The physical
    // COM decrement happens here (main thread, after the RT thread has joined).
    st.oldPerfReleaseBlock = confirmBlock;
    st.oldPerfReleasedPostCrossfade = rtMovedToNew && (confirmBlock >= K_SWAP);

    // COM-atomic decrement; deletes the PerformerInterface when the count hits 0.
    st.performers[0] = cmaj::Performer{};
}

} // namespace g1a
