# SSI: Software That Serves Itself

## Developing your own frame and language

Imagine a tool you do not have to learn so much as teach.

The deepest barrier in existing creative and technical tools is not money, and not even difficulty in the abstract. It is that you must learn the system's vocabulary before you can express your own. There is a translation tax. You arrive with something already in your head, a sound, a structure, a shape, a result you can feel, and before you can reach it you have to first become fluent in how someone else decided to carve up the world into objects and parameters and connections. The tool demands that you become fluent in it before it will speak with you. By the time you have learned its language, the thing you came to make has often slipped away.

What I am describing inverts the direction the vocabulary grows. You are introduced to only a minimal language and a minimal philosophy, a small fixed core, and from there you develop almost everything else through your own frame and your own language interface. You are not learning the system's words. The system is learning yours.

You describe what you want in the terms that are natural to you, and the software realizes it. That realization then becomes part of your personal vocabulary. The next time, you do not re-explain it. You simply call it by the name you gave it, and it is there. Over weeks and months you accumulate not a library of presets but a living dialect, one shaped entirely by the work you actually do rather than by the work the tool's designers happened to anticipate.

This is profoundly different from a preset library. A preset is someone else's frozen decision. What this grows is a frame and a language that belong to you. Two people working in the same system for a year would end up with completely divergent vocabularies, because the vocabulary is a fossil record of their own intuitions and their own projects. The minimal language is the seed. The art is grown in your own frame.

I call this SSI: software that serves itself, or software serving itself. The rest of this is an attempt to explain how it works and why I think it matters.

## The concept

SSI is a concept I have been thinking about a lot, and the more I sit with it the more it feels less like a clever idea and more like the description of a shift that is already underway.

I am seeing an entire paradigm phase shift happening. It is not just happening in front of my eyes as something I observe from a distance. It is happening inside my relationship to software itself: how I build it, how I think about it, and how I am embodied with it. The boundary between me and the tools I make has started to dissolve, and SSI is my attempt to name what is on the other side of that dissolution.

I am beginning to see a future in which software is built foundationally as a harness for agentic self-improvement. That improvement flows from two directions at once. It comes from the agent itself, which is to say from the software, and it comes from the user of that software. The two are not separate parties negotiating across a membrane. They are co-authors of the same living thing. The personal dialect described above, the frame and language each user grows, is what becomes possible once software is built this way.

## At the core is an agent harness

This is the load-bearing claim, so I want to state it as plainly as possible. At the core of an SSI application is an agent harness. Not an agent bolted onto a finished product, and not a chat window pasted into a sidebar, but a harness that the entire piece of software is built on top of. The harness is the foundation. Everything else is something the harness grows.

This is what separates SSI from the agentic tools people already know. I am not talking about a harness for general agentic use, the way Claude Code or a Hermes-style agent works. Those are agents that act upon software from the outside. They treat a codebase as a patient to be operated on. The agent and the software remain two separate things, sitting on opposite sides of a line.

What I am describing is a piece of software that, at its very core, is built like an AI agent harness, something in the spirit of the Pi minimal coding agent. But instead of living in an environment framed around general coding, this environment is constrained specifically to the software it is running on. The agent does not roam across an open world of arbitrary code. It inhabits one room, and it knows that room completely.

Because the software is the harness, the agent is not given a repository to fix, upgrade, or improve from the outside. It is given an environment to live in and be coupled to. It owns every tool in that environment. It knows the underlying library and the interface that constrains it, which means it can see every tool it has access to and every rule governing how it may build and map itself. The possibility space is enumerable. The agent is not writing arbitrary code into the void. It is composing from a known alphabet, inside a known room, updating the software by itself in response to what the user expresses. And it carries a memory of what it has already built and a sense of what could be built next. This is the machinery beneath the personal language. When you name a thing and call it back into being, it is the harness, composing from its known alphabet, that makes the name mean something.

## Who this is for: the builder

SSI is built for a particular kind of person, the one who wants to make tools and artefacts out of their software rather than simply consume its features.

This is not limited to music, even though music is where I see it most vividly. The same architecture serves anyone whose work is the making of things. It could be a person writing software, building their own development environment that grows new capabilities as they reach for them. It could be music software, where the instrument codes itself into new sounds on request. It could be engineering software, where the tool assembles new analyses and components as the problem demands. It could be design software, where the canvas and its instruments extend themselves toward whatever the designer is trying to express.

In every one of these cases the user is a builder, and the software is not a fixed set of features they must work within. It is a substrate that builds new tools for them, with them, as they go. The artefact they are making and the software they are making it in grow together.

## The substrate and the meta-language

In the music case, the framework this could be embedded in is Cmajor, a C-family language designed specifically for writing audio and DSP signal processing code. Its core abstraction already mirrors the architecture I am describing. Cmajor splits the world into processors, which are units of DSP with defined input and output endpoints, and graphs, which wire processors together. The processor is the empty box. Its endpoints are the fixed surface, the holes through which signal flows. The graph is the wiring.

On top of this substrate you could create a meta-language, not dissimilar in spirit to MaxMSP, but far more user friendly. A module begins as empty potential, a box waiting to become whatever it is asked to become. The user asks it to be a particular kind of oscillator, or a particular kind of filter, and the module resolves itself into that thing. The user expresses intent. The agent realizes that intent as a processor. The compiler verifies it. The result plays.

In this way, the software is self-transforming.

## Why this is different from software as a service

The act of using the software and the act of authoring it become the same act. You can talk to an SSI application as a user, but the framework through which it expresses itself, and through which it couples to you, is not simply a chat interface. The whole point is that you communicate with the software in a way that transforms it. Speech becomes structure. Intent becomes architecture.

A few principles fall out of all this, and they are worth stating plainly.

The software ships as a capacity, not as a set of capabilities. What arrives in your hands is not a frozen bundle of features but a generative kernel: the agent harness, the primitives, and the constraints. The features come later, summoned on demand, shaped by use.

Authorship moves from the past into the present. In traditional software, the making happened before release, in a building you will never visit, expressing the intent of people you will never meet. In SSI, the making is continuous with the using. You are a co-author, not a tenant.

Identity migrates from the feature set to the invariant core plus its lived history. Two copies of an SSI application that shipped identical would, after a year of use, be genuinely different individuals. Not different configurations of the same product, but different things, each one a fossil record of the work its user actually did. The invariants are the spine that stays fixed while everything above them transforms. The constraints govern what can move and how. A thing that could change everything about itself would dissolve into a runtime with no character. A thing that changes everything except a carefully chosen core can grow a biography without losing a self.

## A new creative class

There is a cultural shift latent in all of this, and it suggests a different way of talking about AI than the two that dominate now.

Jaron Lanier has argued that we think about AI wrongly when we treat it as a thing, a new entity that did this or decided that. There is another way to see it, in which AI is not a creature at all but a collaboration of people, a large and high level form of human cooperation built from the work of everyone whose data it was trained on. SSI builds on that frame. The agent is not a separate mind you negotiate with. It is a collaborative layer that extends your capacity to make, while the authorship stays with you.

What sets this apart from the ordinary story of being helped by a tool is where authorship sits. Most tools extend you in directions you had no say in producing. SSI cultivates a different skill: the authoring of your own meta-language through the use of the tool. You are not merely extended by an instrument you did not shape. You grow the instrument, and the language you use to speak to it, and that language becomes part of you. The tool extends your reach, and you extend the tool.

Out of this I think new creative classes would emerge, and new kinds of creative labor. A role appears that did not quite exist before, neither only artist nor only engineer, but a maker who works at the level of the frame itself. The labor is not just the finished artefact. It is also the language and the frame that produced it, grown and tended over time, and that deserves to be recognized as work. These classes would not be gated by access to expensive or arcane tools, but defined by the clarity of what each person is trying to say and the frame they built to say it in. A person with something to express could build the very means of expressing it.

This is also why the story matters and not only the architecture. The dominant narratives around AI collapse into two postures: a techno-utopian accelerationism that wants the entity to arrive and sweep the old world away, and a reactionary skepticism that sees only theft and loss. Building this way refuses both. It asks you neither to worship an arriving mind nor to reject the technology wholesale. It treats AI as Lanier suggests, as people collaborating, and puts the human at the center of authorship. The hope is concrete and modest: that we could use these systems to widen the circle of makers and deepen the personal character of what they make.

If we made this way of building ordinary, the culture of making would become more open, more personal, and more alive, with room for kinds of creative work, and creative workers, we do not yet have names for.

This is SSI.
