// metrics.cpp — Goertzel, timing reduction, mix-identity, click bound (with K_SWAP
// boundary excluded), completeness audit, embedded SHA-256.
#include "metrics.h"
#include "crossfade.h"
#include "host_config.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <cstdio>

namespace g1a {

// ───────────────────────────── SHA-256 ───────────────────────────
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
    return sha256_hex(reinterpret_cast<const void*>(buf), (size_t)(numFloats * sizeof(float)));
}

// ───────────────────────────── Goertzel ──────────────────────────
double goertzelMag(const float* x, uint64_t M, double freq, double fs)
{
    const double pi = 3.14159265358979323846;
    const double w = 2.0 * pi * freq / fs;
    const double cw = std::cos(w);
    const double sw = std::sin(w);
    const double coeff = 2.0 * cw;
    double s_prev = 0.0, s_prev2 = 0.0;
    for (uint64_t n = 0; n < M; ++n)
    {
        double s = (double)x[n] + coeff * s_prev - s_prev2;
        s_prev2 = s_prev;
        s_prev = s;
    }
    double real = s_prev - s_prev2 * cw;
    double imag = s_prev2 * sw;
    return std::sqrt(real * real + imag * imag) / (double)M;
}

// ───────────────────────────── R3a mix-identity (per-block equal-power) ─
double mixError(const float* xfade, const float* a, const float* b, uint64_t M)
{
    double mx = 0.0;
    for (uint64_t m = 0; m < M; ++m)
    {
        // Determine which crossfade block this sample belongs to
        uint32_t blkIdx = static_cast<uint32_t>(m / BLOCK_SIZE);
        if (blkIdx >= W_XFADE) break;
        const double alpha = equalPowerAlpha(blkIdx);
        const double beta  = equalPowerBeta(blkIdx);
        const double ref = alpha * static_cast<double>(a[m]) + beta * static_cast<double>(b[m]);
        const double d = std::fabs(static_cast<double>(xfade[m]) - ref);
        if (d > mx) mx = d;
    }
    return mx;
}

bool alphaMonotone()
{
    // Check 64 per-block points: a non-increasing, b non-decreasing, a²+b²≈1.
    double prevA = 1.1;  // start above 1 to catch first a==1
    double prevB = -0.1;  // start below 0 to catch first b==0
    for (uint32_t i = 0; i < W_XFADE; ++i)
    {
        double a = equalPowerAlpha(i);
        double b = equalPowerBeta(i);
        if (a > prevA) return false;  // a must be non-increasing
        if (b < prevB) return false;  // b must be non-decreasing
        if (std::fabs(a * a + b * b - 1.0) > EPS_XFADE) return false;
        prevA = a;
        prevB = b;
    }
    return true;
}

// ───────────────────────────── R3f click bound (K_SWAP excluded) ─
double clickMaxExcludeBoundary(const float* x, uint64_t M, uint64_t boundarySample)
{
    double mx = 0.0;
    for (uint64_t k = 1; k < M; ++k)
    {
        // Skip the pair that straddles the K_SWAP boundary
        if (k == boundarySample) continue;
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

} // namespace g1a
