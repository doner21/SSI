import struct, hashlib, math, sys

A_DIR = "g1a/_run-reload/spike/artifacts/"

def read_wav_f32(path):
    with open(path,"rb") as f:
        d=f.read()
    assert d[:4]==b"RIFF" and d[8:12]==b"WAVE", path
    # find data chunk
    i=12
    pcm=None
    while i+8<=len(d):
        cid=d[i:i+4]; sz=struct.unpack("<I",d[i+4:i+8])[0]
        body=d[i+8:i+8+sz]
        if cid==b"data":
            pcm=body; break
        i+=8+sz+(sz&1)
    n=len(pcm)//4
    return list(struct.unpack("<%df"%n, pcm[:n*4])), pcm[:n*4]

def goertzel(x, f, fs):
    w=2*math.pi*f/fs; c=math.cos(w); coeff=2*c
    s0=s1=s2=0.0
    for v in x:
        s0=v+coeff*s1-s2; s2=s1; s1=s0
    re=s1-s2*c; im=s2*math.sin(w)
    return math.sqrt(re*re+im*im)/(len(x)/2)

full,_=read_wav_f32(A_DIR+"full_output.wav")
apre,_=read_wav_f32(A_DIR+"A_pre.wav")
bpost,_=read_wav_f32(A_DIR+"B_post.wav")
axf,axf_pcm=read_wav_f32(A_DIR+"A_xfade.wav")
bxf,_=read_wav_f32(A_DIR+"B_xfade.wav")
xreg,_=read_wav_f32(A_DIR+"crossfade_region.wav")
asolo,_=read_wav_f32(A_DIR+"A_solo.wav")
bsolo,_=read_wav_f32(A_DIR+"B_solo.wav")

fs=48000
print("len full=%d (expect 2560000)"%len(full))
print("len A_pre=%d B_post=%d (expect 131072)"%(len(apre),len(bpost)))
print("len A_xfade=%d B_xfade=%d xreg=%d (expect 16384)"%(len(axf),len(bxf),len(xreg)))

# click_max over full output
cm=0.0; cmidx=-1
for k in range(1,len(full)):
    dlt=abs(full[k]-full[k-1])
    if dlt>cm: cm=dlt; cmidx=k
print("RECOMPUTED click_max = %.12f at sample %d (gate <=0.15)"%(cm,cmidx))

# mix identity: xreg == (1-alpha)*A + alpha*B, alpha(n)=n/16383
W=16384
mix_err=0.0; mono=True; prev=-1.0
for n in range(W):
    a=n/(W-1)
    if a<prev-1e-15: mono=False
    prev=a
    expect=(1-a)*axf[n]+a*bxf[n]
    e=abs(xreg[n]-expect)
    if e>mix_err: mix_err=e
print("RECOMPUTED mix_err = %.6e (gate <=1e-6)  alpha_monotone=%s  alpha0=%.1f alphaLast=%.1f"%(mix_err,mono,0.0,(W-1)/(W-1)))

# Goertzel endpoints
mAp440=goertzel(apre,440,fs); mAp880=goertzel(apre,880,fs); mAp660=goertzel(apre,660,fs)
mBp880=goertzel(bpost,880,fs); mBp440=goertzel(bpost,440,fs); mBp660=goertzel(bpost,660,fs)
mAs440=goertzel(asolo,440,fs); mBs880=goertzel(bsolo,880,fs)
rel440_pre=mAp440/mAs440
rel880_post=mBp880/mBs880
leak880_pre=mAp880/mAs440
leak440_post=mBp440/mBs880
rel_ctl=max(mAp660,mBp660)/max(mAs440,mBs880)
print("RECOMPUTED rel440_pre = %.6f (gate >=0.40)"%rel440_pre)
print("RECOMPUTED rel880_post= %.6f (gate >=0.40)"%rel880_post)
print("RECOMPUTED leak880_pre= %.6e (gate <=0.10)"%leak880_pre)
print("RECOMPUTED leak440_post=%.6e (gate <=0.10)"%leak440_post)
print("RECOMPUTED rel_ctl    = %.6e (gate <=0.10)"%rel_ctl)

# Determinism: hash the raw PCM float bytes of full/A/B/xfade and compare structure
def h(pcm): return hashlib.sha256(pcm).hexdigest()
_,full_pcm=read_wav_f32(A_DIR+"full_output.wav")
_,a_pcm=read_wav_f32(A_DIR+"A_xfade.wav")
print("buffer-hash full_output PCM = %s"%h(full_pcm))
print("buffer-hash A_xfade   PCM = %s"%h(a_pcm))

# Verify B genuinely different: A_pre dominated by 440, B_post by 880
print("A_pre: mag440=%.4f mag880=%.4f -> 440 dominates: %s"%(mAp440,mAp880,mAp440>10*mAp880))
print("B_post: mag880=%.4f mag440=%.4f -> 880 dominates: %s"%(mBp880,mBp440,mBp880>10*mBp440))
