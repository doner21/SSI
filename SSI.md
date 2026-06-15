# SSI: Software That Serves Itself

These are thoughts that have been floating around in me for over a year — since I started building inside minimal agentic open-source coding harnesses. This is my attempt to name what I see happening.

---

## The Concept

**SSI** stands for **software that serves itself**, or **software serving itself**. It is a concept I have been thinking about a lot, and the more I sit with it the more it feels less like a clever idea and more like the description of a shift that is already underway.

I am seeing an entire paradigm phase shift happening. It is not just happening in front of my eyes as something I observe from a distance. It is happening inside my relationship to software itself: how I build it, how I think about it, and how I am embodied with it. The boundary between me and the tools I make has started to dissolve, and SSI is my attempt to name what is on the other side of that dissolution.

I am beginning to see a future in which software is built foundationally as a harness for agentic self-improvement. That improvement flows from two directions at once. It comes from the agent itself, which is to say from the software, and it comes from the user of that software. The two are not separate parties negotiating across a membrane. They are co-authors of the same living thing.

---

## At the Core Is an Agent Harness

This is the load-bearing claim, so I want to state it as plainly as possible. At the core of an SSI application is an **agent harness**. Not an agent bolted onto a finished product, and not a chat window pasted into a sidebar, but a harness that the *entire piece of software is built on top of*. The harness is the foundation. Everything else is something the harness grows.

This is what separates SSI from the agentic tools people already know. I am not talking about a harness for general agentic use, the way Claude Code or a Hermes-style agent works. Those are agents that act *upon* software from the outside. They treat a codebase as a patient to be operated on. The agent and the software remain two separate things, sitting on opposite sides of a line.

What I am describing is a piece of software that, at its very core, is built like an AI agent harness — something in the spirit of the Pi minimal coding agent. But instead of living in an environment framed around general coding, this environment is constrained specifically to the software it is running on. The agent does not roam across an open world of projects and arbitrary code. It inhabits **one room**, and it knows that room completely.

Because the software *is* the harness, the agent is not given a repository to fix, upgrade, or improve from the outside. It is given an environment to live in and be coupled to. It owns every tool in that environment. It knows the underlying library and the interface that constrains it, which means it can see every tool it has access to and every rule governing how it may build and map itself — as it has persistent memory and an evolving graph of itself. The possibility space is enumerable. The agent is composing from a known alphabet, inside a known room, updating the software by itself in response to what the user expresses. And it carries a memory of what it has already built and a sense of what could be built next.

---

## Who This Is For: The Builder

SSI is built for a particular kind of person — the one who wants to make tools and artefacts out of their software rather than simply consume its features.

I work and build within music software but this is not limited to music, even though music is where I see it most vividly. The same architecture serves anyone whose work is the making of things. It could be a person writing software, building their own development environment that grows new capabilities as they reach for them. It could be music software, where the instrument codes itself into new sounds on request. It could be engineering software, where the tool assembles new analyses and components as the problem demands. It could be design software, where the canvas and its instruments extend themselves toward whatever the designer is trying to express.

In every one of these cases the user is a builder, and the software is not a fixed set of features they must work within. It is a substrate that builds new tools for them, *with them*, as they go. The artefact they are making and the software they are making it in grow together.

---

## Developing Your Own Frame and Language

Here is the part that matters most, and the part I want to reinforce, because it is what makes SSI genuinely new rather than just convenient.

The deepest barrier in existing creative and technical tools is not money and not even difficulty in the abstract. It is that **you must learn the system's vocabulary before you can express your own**. There is a translation tax. You arrive with something in your head — a sound, a structure, a shape, a result you can feel — and before you can reach it you have to first become fluent in how someone else decided to carve up the world into objects and parameters and connections. The tool demands that you become fluent in it before it will speak with you.

SSI inverts the direction the vocabulary grows. Now it is possible to introduce a user to only a minimal language and a minimal philosophy — the small fixed core of primitives and constraints — and then let them develop almost everything else through their own frame and their own language interface. The user is not learning the system's words. **The system is learning theirs.**

You describe what you want in the terms that are natural to you, and the agent, constrained by the minimal core, realizes it. That realization then becomes part of your personal vocabulary. The next time, you do not re-explain it. You simply call it by the name you gave it, and it is there. Over weeks and months you accumulate not a library of presets but a **living dialect** — one shaped entirely by the work you actually do rather than by the work the tool's designers happened to anticipate.

This is profoundly different from a preset library. A preset is someone else's frozen decision. What SSI grows is a frame and a language that belong to you. Two people using the same SSI system for a year would end up with completely divergent vocabularies, because the vocabulary is a fossil record of their own intuitions and their own projects. The minimal language is the seed. The art is grown in the user's own frame.

---

## The Substrate and the Meta-Language

In the music case, the framework this could be embedded in is **Cmajor** — a C-family language designed specifically for writing audio and DSP signal processing code. Its core abstraction already mirrors the architecture I am describing. Cmajor splits the world into *processors*, which are units of DSP with defined input and output endpoints, and *graphs*, which wire processors together. The processor is the empty box. Its endpoints are the fixed surface — the holes through which signal flows. The graph is the wiring.

On top of this substrate you could create a meta-language, not dissimilar in spirit to MaxMSP, but far more user-friendly. A module begins as empty potential, a box waiting to become whatever it is asked to become. The user asks it to be a particular kind of oscillator, or a particular kind of filter, and the module resolves itself into that thing. The user expresses intent. The agent realizes that intent as a processor. The compiler verifies it. The result plays.

In this way, the software is **self-transforming**.

---

## Why This Is Different from Software as a Service

The act of using the software and the act of authoring it become the same act. You can talk to an SSI application as a user, but the framework through which it expresses itself, and through which it couples to you, is not simply a chat interface. The whole point is that you communicate with the software in a way that transforms it. **Speech becomes structure. Intent becomes architecture.**

A few principles fall out of all this, and they are worth stating plainly.
### Principles of SSI

**The software ships as a capacity, not as a set of capabilities.**
What arrives in your hands is not a frozen bundle of features but a generative kernel: the agent harness, the primitives, and the constraints. The features come later, summoned on demand, shaped by use.

**Authorship moves from the past into the present.**
In traditional software, the making happened before release, in a building you will never visit, expressing the intent of people you will never meet. In SSI, the making is continuous with the using. You are a co-author, not a tenant.

**Identity migrates from the feature set to the invariant core plus its lived history.**
Two copies of an SSI application that shipped identical would, after a year of use, be genuinely different individuals. Not different configurations of the same product, but different things — each one a fossil record of the work its user actually did. The invariants are the spine that stays fixed while everything above them transforms. The constraints govern what can move and how. A thing that could change everything about itself would dissolve into a runtime with no character. A thing that changes everything except a carefully chosen core can grow a biography without losing a self.

---

## A Cultural Note

There is a cultural shift latent in all of this, and I think it is a hopeful one.

If building in this way became a norm rather than an exception, I believe something would begin to change in the culture around creative work. At the center of that change is **control of the frame**. Most tools hand you a frame and ask you to work inside it. SSI hands you the means to shape the frame itself, and then, over time, to shape the way you shape it. That second movement is the one I find most exciting, because it is where the real authorship lives.

When you build this way, using the tool becomes an act of symbolic shaping and gesture. You are not selecting from a menu of someone else's decisions. You are reaching into the material and forming it, and each act of forming leaves something behind. You develop an abstract and symbolic layer that grows organically out of you — a meta-language that is yours. You come to know that meta-language intimately, the way you come to know an instrument you have played for years, because you did not inherit it. You grew it. It carries your accent because it was shaped by your own history of reaching for things.

This is a different relationship to a tool than the one most of us have lived inside. The tool stops being a fixed surface you press against and becomes a frame you are continually authoring. You learn the language you are using, and you also learn to extend it, to bend it toward what you actually mean. The distance between having an idea and making the thing closes, not because the work becomes easier in some shallow sense, but because the frame itself moves with you instead of resisting you. So much intention never survives the journey from the mind to the tool. When the frame is yours to shape, more of what you actually meant to make survives.

There is also something in the grain of this approach that resists the flattening I have come to expect from software. Frames that grow in each person's own hands diverge rather than converge. If many people built this way, the work would carry more of the particular person in it — more idiosyncrasy, more accent — because the instrument itself would have been shaped by the one playing it. A creative class defined less by access to expensive or arcane tools, and more by the clarity of what each person is trying to say and the frame they have built to say it in, is something I find genuinely hopeful. If we made this way of building ordinary, the culture of making could become more open, more personal, and more alive.

**This is SSI.**
