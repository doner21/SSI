// event_schedule.cpp — deterministic event schedule from SEED_MASTER via SplitMix64.
#include "event_schedule.h"
#include "host_config.h"

#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>
#include <cstring>

namespace g1a {

// ── SplitMix64 ────────────────────────────────────────────────────
static inline uint64_t splitmix64_next(uint64_t& x)
{
    uint64_t z = (x += 0x9E3779B97F4A7C15ull);
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ull;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBull;
    return z ^ (z >> 31);
}

// Derive a random frequency from palette
static double pickFreq(uint64_t& rng)
{
    uint64_t r = splitmix64_next(rng);
    uint32_t idx = (uint32_t)(r % FREQ_PALETTE_COUNT);
    return FREQ_PALETTE_RAW[idx];
}

// Pick a random block in [lo, hi)
static uint32_t pickBlock(uint64_t& rng, uint32_t lo, uint32_t hi)
{
    if (lo >= hi) return lo;
    uint64_t r = splitmix64_next(rng);
    return lo + (uint32_t)(r % (uint64_t)(hi - lo));
}

EventSchedule generateEventSchedule(uint64_t seedMaster)
{
    EventSchedule sched;
    uint64_t rng = seedMaster;
    splitmix64_next(rng);  // one warm-up step

    // Generate ~20 events spread across the full N_BLOCKS range, avoiding the
    // sentinel-protected windows.

    // Phase 1: one event in [1, K_XFADE_START - P_MEAS)  (before A_PRE)
    // Phase 2: one event in [K_XFADE_START, K_SWAP - 1]  (during crossfade, before the swap)
    // Phase 3: events in (K_SWAP + P_MEAS, N_BLOCKS - 1] (after B_POST)

    // For each phase we add 1-3 events.

    auto addEvent = [&](uint32_t block, double freq) {
        sched.events.push_back({block, freq});
    };

    double lastFreq = 220.0;  // start with a known value

    // ── Phase 1: events before the A_PRE window ──
    // Ensure at least one event in [1, A_PRE_START)
    uint32_t p1lo = 1, p1hi = A_PRE_START;
    if (p1hi > p1lo)
    {
        uint32_t b = pickBlock(rng, p1lo, p1hi);
        double f = pickFreq(rng);
        addEvent(b, f);
        lastFreq = f;

        // Maybe add a second event
        if ((splitmix64_next(rng) & 1) && (p1hi - p1lo > 1))
        {
            uint32_t b2 = pickBlock(rng, p1lo, p1hi);
            if (b2 != b)
            {
                double f2 = pickFreq(rng);
                addEvent(b2, f2);
                lastFreq = f2;
            }
        }
    }

    // ── Phase 2: events in crossfade window [K_XFADE_START, K_SWAP - 1] ──
    uint32_t p2lo = K_XFADE_START, p2hi = K_SWAP - 1;
    if (p2hi > p2lo)
    {
        uint32_t b = pickBlock(rng, p2lo, p2hi);
        double f = pickFreq(rng);
        // Must ensure this is different from lastFreq for the "change before swap" sentinel
        if (std::fabs(f - lastFreq) < 0.01) {
            // Cycle through palette to find a different freq
            for (uint32_t i = 1; i < FREQ_PALETTE_COUNT; ++i)
                if (std::fabs(FREQ_PALETTE_RAW[(uint32_t)(i + (uint32_t)(rng & 3)) % FREQ_PALETTE_COUNT] - lastFreq) >= 0.01)
                    { f = FREQ_PALETTE_RAW[(uint32_t)(i + (uint32_t)(rng & 3)) % FREQ_PALETTE_COUNT]; break; }
        }
        addEvent(b, f);
        lastFreq = f;

        // Maybe add one more
        if ((splitmix64_next(rng) & 1) && (p2hi - p2lo > 1))
        {
            uint32_t b2 = pickBlock(rng, p2lo, p2hi);
            if (b2 != b)
            {
                double f2 = pickFreq(rng);
                addEvent(b2, f2);
                lastFreq = f2;
            }
        }
    }

    // ── Phase 3: events after B_POST [B_POST_END, N_BLOCKS) ──
    uint32_t p3lo = B_POST_END, p3hi = N_BLOCKS;
    if (p3hi > p3lo)
    {
        // At least one event after B_POST
        uint32_t b = pickBlock(rng, p3lo, p3hi);
        double f = pickFreq(rng);
        addEvent(b, f);
        lastFreq = f;

        // Maybe add another
        if ((splitmix64_next(rng) & 1) && (p3hi - p3lo > 1))
        {
            uint32_t b2 = pickBlock(rng, p3lo, p3hi);
            if (b2 != b)
            {
                double f2 = pickFreq(rng);
                addEvent(b2, f2);
            }
        }
    }

    // Sort events by block
    std::sort(sched.events.begin(), sched.events.end(),
              [](const FreqEvent& a, const FreqEvent& b) { return a.block < b.block; });

    // ── Audit sentinels ──
    sched.sentinel_at_least_one_in_0_KXFADE = false;
    sched.sentinel_no_change_in_APRE = true;   // we didn't put any in APRE
    sched.sentinel_change_strictly_before_KSWAP = false;
    sched.sentinel_no_change_in_BPOST = true;   // we didn't put any in BPOST
    sched.sentinel_at_least_one_after_BPOST = false;

    for (const auto& e : sched.events)
    {
        if (e.block < K_XFADE_START)
            sched.sentinel_at_least_one_in_0_KXFADE = true;
        if (e.block >= A_PRE_START && e.block < K_XFADE_START)
            sched.sentinel_no_change_in_APRE = false;  // violation
        if (e.block >= K_XFADE_START && e.block < K_SWAP)
            sched.sentinel_change_strictly_before_KSWAP = true;
        if (e.block >= K_SWAP && e.block < K_SWAP + P_MEAS)
            sched.sentinel_no_change_in_BPOST = false;  // violation
        if (e.block >= B_POST_END)
            sched.sentinel_at_least_one_after_BPOST = true;
    }

    // ── Counting ──
    sched.events_scheduled_in_0_KSWAP  = sched.eventsInRange(0, K_SWAP);
    sched.events_scheduled_in_KXFADE_KSWAP = sched.eventsInRange(K_XFADE_START, K_SWAP);
    sched.events_scheduled_in_KSWAP_N  = sched.eventsInRange(K_SWAP, N_BLOCKS);

    return sched;
}

double EventSchedule::stateAt(uint32_t block) const
{
    // Start with first palette value as default
    double f = FREQ_PALETTE_RAW[0];
    for (const auto& e : events)
    {
        if (e.block <= block)
            f = e.freq;
        else
            break;
    }
    return f;
}

uint64_t EventSchedule::eventsInRange(uint32_t lo, uint32_t hi) const
{
    uint64_t count = 0;
    for (const auto& e : events)
        if (e.block >= lo && e.block < hi)
            ++count;
    return count;
}

// ── SHA-256 for schedule hash ─────────────────────────────────────
namespace {

struct Sha256Ctx
{
    uint32_t state[8];
    uint64_t bitlen;
    uint8_t  data[64];
    uint32_t datalen;
};

inline uint32_t rotr(uint32_t x, uint32_t n) { return (x >> n) | (x << (32 - n)); }

const uint32_t K[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2 };

void sha256_init(Sha256Ctx& c)
{
    c.datalen = 0; c.bitlen = 0;
    c.state[0]=0x6a09e667; c.state[1]=0xbb67ae85; c.state[2]=0x3c6ef372; c.state[3]=0xa54ff53a;
    c.state[4]=0x510e527f; c.state[5]=0x9b05688c; c.state[6]=0x1f83d9ab; c.state[7]=0x5be0cd19;
}

void sha256_transform(Sha256Ctx& c, const uint8_t* d)
{
    uint32_t m[64], a,b,e,f,g,h,t1,t2,cc,dd;
    for (uint32_t i=0,j=0;i<16;++i,j+=4)
        m[i]=(d[j]<<24)|(d[j+1]<<16)|(d[j+2]<<8)|(d[j+3]);
    for (uint32_t i=16;i<64;++i)
    {
        uint32_t s0=rotr(m[i-15],7)^rotr(m[i-15],18)^(m[i-15]>>3);
        uint32_t s1=rotr(m[i-2],17)^rotr(m[i-2],19)^(m[i-2]>>10);
        m[i]=m[i-16]+s0+m[i-7]+s1;
    }
    a=c.state[0];b=c.state[1];cc=c.state[2];dd=c.state[3];
    e=c.state[4];f=c.state[5];g=c.state[6];h=c.state[7];
    for (uint32_t i=0;i<64;++i)
    {
        uint32_t S1=rotr(e,6)^rotr(e,11)^rotr(e,25);
        uint32_t ch=(e&f)^((~e)&g);
        t1=h+S1+ch+K[i]+m[i];
        uint32_t S0=rotr(a,2)^rotr(a,13)^rotr(a,22);
        uint32_t maj=(a&b)^(a&cc)^(b&cc);
        t2=S0+maj;
        h=g;g=f;f=e;e=dd+t1;dd=cc;cc=b;b=a;a=t1+t2;
    }
    c.state[0]+=a;c.state[1]+=b;c.state[2]+=cc;c.state[3]+=dd;
    c.state[4]+=e;c.state[5]+=f;c.state[6]+=g;c.state[7]+=h;
}

void sha256_update(Sha256Ctx& c, const uint8_t* data, size_t len)
{
    for (size_t i=0;i<len;++i)
    {
        c.data[c.datalen++]=data[i];
        if (c.datalen==64){ sha256_transform(c,c.data); c.bitlen+=512; c.datalen=0; }
    }
}

void sha256_final(Sha256Ctx& c, uint8_t* hash)
{
    uint32_t i=c.datalen;
    if (c.datalen<56){ c.data[i++]=0x80; while(i<56) c.data[i++]=0x00; }
    else { c.data[i++]=0x80; while(i<64) c.data[i++]=0x00; sha256_transform(c,c.data); std::memset(c.data,0,56); }
    c.bitlen+=(uint64_t)c.datalen*8;
    for (int k=7;k>=0;--k) c.data[56+(7-k)]=(uint8_t)(c.bitlen>>(k*8));
    sha256_transform(c,c.data);
    for (size_t i=0;i<4;++i)
        for (uint32_t j=0;j<8;++j)
            hash[i+j*4]=(uint8_t)((c.state[j]>>(24-i*8))&0xff);
}

} // anonymous namespace

static std::string sha256_hex(const void* data, size_t numBytes)
{
    Sha256Ctx c; sha256_init(c);
    sha256_update(c, reinterpret_cast<const uint8_t*>(data), numBytes);
    uint8_t h[32]; sha256_final(c, h);
    static const char* hx = "0123456789abcdef";
    std::string out; out.resize(64);
    for (int i=0;i<32;++i){ out[i*2]=hx[h[i]>>4]; out[i*2+1]=hx[h[i]&0xf]; }
    return out;
}

std::string scheduleJson(const EventSchedule& sched, uint64_t seedMaster)
{
    std::ostringstream oss;
    oss << std::setprecision(17);
    oss << "{\n";
    oss << "  \"seed_master\": \"0x" << std::hex << seedMaster << std::dec << "\",\n";
    oss << "  \"algorithm\": \"SplitMix64\",\n";
    oss << "  \"freq_palette\": [";
    for (uint32_t i = 0; i < FREQ_PALETTE_COUNT; ++i)
    {
        if (i > 0) oss << ", ";
        oss << FREQ_PALETTE_RAW[i];
    }
    oss << "],\n";
    oss << "  \"event_model\": \"change-blocks-only\",\n";
    oss << "  \"events\": [\n";
    for (size_t i = 0; i < sched.events.size(); ++i)
    {
        oss << "    [ " << sched.events[i].block << ", " << sched.events[i].freq << " ]";
        if (i + 1 < sched.events.size()) oss << ",";
        oss << "\n";
    }
    oss << "  ],\n";
    oss << "  \"events_scheduled_in_0_KSWAP\": " << sched.events_scheduled_in_0_KSWAP << ",\n";
    oss << "  \"events_scheduled_in_KXFADE_KSWAP\": " << sched.events_scheduled_in_KXFADE_KSWAP << ",\n";
    oss << "  \"events_scheduled_in_KSWAP_N\": " << sched.events_scheduled_in_KSWAP_N << ",\n";
    oss << "  \"sentinels\": {\n";
    oss << "    \"at_least_one_in_0_KXFADE\": " << (sched.sentinel_at_least_one_in_0_KXFADE ? "true" : "false") << ",\n";
    oss << "    \"no_change_in_APRE_3488_4000\": " << (sched.sentinel_no_change_in_APRE ? "true" : "false") << ",\n";
    oss << "    \"change_strictly_before_KSWAP\": " << (sched.sentinel_change_strictly_before_KSWAP ? "true" : "false") << ",\n";
    oss << "    \"no_change_in_BPOST_4064_4576\": " << (sched.sentinel_no_change_in_BPOST ? "true" : "false") << ",\n";
    oss << "    \"at_least_one_after_BPOST\": " << (sched.sentinel_at_least_one_after_BPOST ? "true" : "false") << "\n";
    oss << "  },\n";
    oss << "  \"stateAt_KXFADE_START\": " << sched.stateAt(K_XFADE_START) << ",\n";
    oss << "  \"stateAt_KSWAP\": " << sched.stateAt(K_SWAP) << ",\n";
    oss << "  \"APRE_frequency\": " << sched.stateAt(A_PRE_START) << ",\n";
    std::string content = oss.str();
    std::string hash = sha256_hex(content.c_str(), content.size());
    oss << "  \"sha256\": \"" << hash << "\"\n";
    oss << "}\n";
    return oss.str();
}

} // namespace g1a
