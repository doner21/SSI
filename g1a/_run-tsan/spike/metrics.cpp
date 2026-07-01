// metrics.cpp — Goertzel, mix-identity, click bound, completeness audit,
// embedded SHA-256, plus WAV-read / prefix-delta / TSan-log parsing for the
// TSan-pass T2/T3/T4 estimators.
//
// PORT NOTE: the SHA-256, Goertzel, mix-identity, click, completeness, and
// timing reductions are IDENTICAL to _run-reload/spike/metrics.cpp (pure
// computation, portable). The WAV-read and log-parse helpers are new, additive
// support for the cross-platform (T4f) and TSan-log (T2/T3) gates.
#include "metrics.h"
#include "crossfade.h"
#include "host_config.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <fstream>
#include <sstream>

namespace g1a {

// ───────────────────────────── SHA-256 ───────────────────────────
// Compact public-domain implementation (FIPS 180-4). Not performance-critical.
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
    uint32_t m[64], a,b,e,f,g,h,t1,t2,cc;
    for (uint32_t i=0,j=0;i<16;++i,j+=4)
        m[i]=(d[j]<<24)|(d[j+1]<<16)|(d[j+2]<<8)|(d[j+3]);
    for (uint32_t i=16;i<64;++i)
    {
        uint32_t s0=rotr(m[i-15],7)^rotr(m[i-15],18)^(m[i-15]>>3);
        uint32_t s1=rotr(m[i-2],17)^rotr(m[i-2],19)^(m[i-2]>>10);
        m[i]=m[i-16]+s0+m[i-7]+s1;
    }
    a=c.state[0];b=c.state[1];cc=c.state[2];uint32_t dd=c.state[3];
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
    for (i=0;i<4;++i)
        for (uint32_t j=0;j<8;++j)
            hash[i+j*4]=(uint8_t)((c.state[j]>>(24-i*8))&0xff);
}

} // anonymous namespace

std::string sha256_hex(const void* data, size_t numBytes)
{
    Sha256Ctx c; sha256_init(c);
    sha256_update(c, reinterpret_cast<const uint8_t*>(data), numBytes);
    uint8_t h[32]; sha256_final(c, h);
    static const char* hx = "0123456789abcdef";
    std::string out; out.resize(64);
    for (int i=0;i<32;++i){ out[i*2]=hx[h[i]>>4]; out[i*2+1]=hx[h[i]&0xf]; }
    return out;
}

std::string sha256_floats(const float* buf, uint64_t numFloats)
{
    // x86 is little-endian; the float32 byte stream is hashed directly (HARNESS-SPEC §8).
    return sha256_hex(reinterpret_cast<const void*>(buf), (size_t)(numFloats * sizeof(float)));
}

// ───────────────────────────── Goertzel ──────────────────────────
double goertzelMag(const float* x, uint64_t M, double freq, double fs)
{
    const double w  = 2.0 * 3.14159265358979323846 * freq / fs;
    const double cw = std::cos(w);
    const double sw = std::sin(w);
    const double coeff = 2.0 * cw;
    double s_prev = 0.0, s_prev2 = 0.0;
    for (uint64_t n = 0; n < M; ++n)
    {
        double s = (double)x[n] + coeff * s_prev - s_prev2;
        s_prev2 = s_prev;
        s_prev  = s;
    }
    double real = s_prev - s_prev2 * cw;
    double imag = s_prev2 * sw;
    return std::sqrt(real * real + imag * imag) / (double)M;
}

// ───────────────────────────── T4b mix-identity ──────────────────
double mixError(const float* xfade, const float* a, const float* b, uint64_t M)
{
    double mx = 0.0;
    for (uint64_t m = 0; m < M; ++m)
    {
        const double alpha = alphaAt(m);
        const double ref = (1.0 - alpha) * (double)a[m] + alpha * (double)b[m];
        const double d = std::fabs((double)xfade[m] - ref);
        if (d > mx) mx = d;
    }
    return mx;
}

bool alphaMonotone(uint64_t M)
{
    if (M < 2) return false;
    if (alphaAt(0) != 0.0) return false;
    if (alphaAt(M - 1) != 1.0) return false;
    double prev = alphaAt(0);
    for (uint64_t m = 1; m < M; ++m)
    {
        double cur = alphaAt(m);
        if (cur < prev) return false;
        prev = cur;
    }
    return true;
}

// ───────────────────────────── T4c click bound ───────────────────
double clickMax(const float* x, uint64_t M)
{
    double mx = 0.0;
    for (uint64_t k = 1; k < M; ++k)
    {
        double d = std::fabs((double)x[k] - (double)x[k - 1]);
        if (d > mx) mx = d;
    }
    return mx;
}

// ───────────────────────────── Timing ────────────────────────────
TimingStats reduceTimings(const std::vector<uint64_t>& blockNs,
                          uint32_t winLo, uint32_t winHi, uint64_t dBlockNs)
{
    TimingStats s;
    for (uint32_t k = winLo; k <= winHi && k < blockNs.size(); ++k)
        if (blockNs[k] > dBlockNs) ++s.xrun_count;

    for (uint64_t t : blockNs)
        if (t > s.max_ns) s.max_ns = t;

    if (!blockNs.empty())
    {
        std::vector<uint64_t> sorted = blockNs;
        std::sort(sorted.begin(), sorted.end());
        s.p50_ns = sorted[(size_t)(0.50 * (sorted.size() - 1))];
        s.p99_ns = sorted[(size_t)(0.99 * (sorted.size() - 1))];
    }
    return s;
}

// ───────────────────────────── Completeness ──────────────────────
CompletenessStats auditCompleteness(const std::vector<uint32_t>& writtenBlocks, uint32_t n)
{
    CompletenessStats s;
    s.blocks_rendered = writtenBlocks.size();
    std::vector<uint8_t> seen(n, 0);
    for (uint32_t b : writtenBlocks)
    {
        if (b < n)
        {
            if (seen[b]) ++s.duplicated_blocks;
            seen[b] = 1;
        }
    }
    for (uint32_t i = 0; i < n; ++i)
        if (!seen[i]) ++s.dropped_blocks;
    return s;
}

bool allEqual(const std::vector<std::string>& hs)
{
    if (hs.empty()) return false;
    for (size_t i = 1; i < hs.size(); ++i)
        if (hs[i] != hs[0]) return false;
    return true;
}

// ───────────────────────────── T4f: WAV read ─────────────────────
bool readWavFloat(const std::string& path, std::vector<float>& out)
{
    out.clear();
    std::ifstream f(path, std::ios::binary);
    if (!f) return false;
    std::vector<uint8_t> d((std::istreambuf_iterator<char>(f)),
                            std::istreambuf_iterator<char>());
    if (d.size() < 44) return false;
    if (std::memcmp(d.data(), "RIFF", 4) != 0) return false;
    if (std::memcmp(d.data() + 8, "WAVE", 4) != 0) return false;

    auto rd32 = [&](size_t off) -> uint32_t {
        return (uint32_t)d[off] | ((uint32_t)d[off+1] << 8)
             | ((uint32_t)d[off+2] << 16) | ((uint32_t)d[off+3] << 24);
    };

    size_t i = 12;
    while (i + 8 <= d.size())
    {
        const bool isData = (std::memcmp(d.data() + i, "data", 4) == 0);
        uint32_t sz = rd32(i + 4);
        size_t body = i + 8;
        if (isData)
        {
            if (body + sz > d.size()) sz = (uint32_t)(d.size() - body);
            uint64_t nFloats = sz / 4;
            out.resize(nFloats);
            std::memcpy(out.data(), d.data() + body, (size_t)nFloats * 4);
            return true;
        }
        i = body + sz + (sz & 1u);
    }
    return false;
}

double prefixMaxDelta(const float* a, uint64_t aLen,
                      const float* b, uint64_t bLen, uint64_t count)
{
    if (aLen < count || bLen < count) return 1e30;  // sentinel: cannot compare
    double mx = 0.0;
    for (uint64_t k = 0; k < count; ++k)
    {
        double d = std::fabs((double)a[k] - (double)b[k]);
        if (d > mx) mx = d;
    }
    return mx;
}

// ───────────────────────────── TSan log parsing ──────────────────
uint64_t countInFile(const std::string& path, const std::string& needle)
{
    std::ifstream f(path);
    if (!f) return 0;
    uint64_t n = 0;
    std::string line;
    while (std::getline(f, line))
        if (line.find(needle) != std::string::npos) ++n;
    return n;
}

bool fileContains(const std::string& path, const std::string& needle)
{
    return countInFile(path, needle) > 0;
}

bool raceNamesFrame(const std::string& path, const std::string& frameNeedle)
{
    std::ifstream f(path);
    if (!f) return false;
    bool sawRace = false, sawFrame = false;
    std::string line;
    while (std::getline(f, line))
    {
        if (line.find("WARNING: ThreadSanitizer: data race") != std::string::npos)
            sawRace = true;
        if (line.find(frameNeedle) != std::string::npos)
            sawFrame = true;
    }
    return sawRace && sawFrame;
}

uint64_t parseSuppressedCount(const std::string& path)
{
    std::ifstream f(path);
    if (!f) return 0;
    std::string line;
    uint64_t total = 0;
    while (std::getline(f, line))
    {
        // TSan prints e.g. "ThreadSanitizer: Suppressed 3 warnings (see ...)".
        size_t p = line.find("Suppressed ");
        if (p != std::string::npos)
        {
            std::istringstream is(line.substr(p + 11));
            uint64_t v = 0;
            if (is >> v) total += v;
        }
    }
    return total;
}

} // namespace g1a
