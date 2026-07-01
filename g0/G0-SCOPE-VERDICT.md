# G0 Actor-Lattice Scope Verdict

**Date:** 2026-06-30
**Plan:** `SSI-DAW-BUILD-PLAN.md` (F1, Plan of Record)
**G0 gate:** §3.3, §9 Phase 0

---

## Verdict: CONDITIONAL PASS

The plan satisfies the G0 substantive gate. All four checks pass with one minor clarification needed. The verdict is **conditional** only on confirming/recording the one language-tightening note in §4.5 below; no structural blockers exist.

---

## Evidence: Four Checks

### Check 1 — Every v1 intent artifact resolves under the single-authority lattice

**Finding: PASS.** The §3.4 adversarial closure attack runs eight artifact classes against the merged intent scale `{reference(+identity), revision, convention, constraint(+actor)}`. Results:

| Artifact class | Reduces to | Authority issue? |
|---|---|---|
| Project-scoped commitment | `constraint` | ✓ Single-user |
| Stable identity across regeneration | `reference.identity` + preservation rules | ✓ No authority needed |
| Conflicting timebases (tempo vs warp vs section-move vs phase-lock) | `constraint` set + precedence solver with anchoring modes | ✓ Single-user, resolved by lattice |
| Single-user authority (persona/template/safety/prior-vs-later) | `constraint.actor` + actor lattice (§3.3) | ✓ **In v1 scope** |
| Multi-authority delegation / peer conflict | **Named open breaker** — scoped out of v1 (§3.3) | ✗ Honestly excluded; plan says so |
| Collaborative multi-user editing | Reduces only under single-authority; peer collaboration = the open breaker | ✗ Scoped out (post-v1) |
| Provenance / rationale | `revision` annotation referencing `convention`/`constraint` | ✓ No authority needed |
| Contradiction between conventions | Distributional + context-tagged (§5.3), not new primitive | ✓ No authority needed |

**Detail check — single-user persona conflicts (§3.3(A)):** "artist-me wants clipping; mastering-me wants clean −14 LUFS" is handled by sub-actor namespaces under `user-global` with explicit user-set ordering. This is single-authority because all personas belong to one user, and the user sets the ordering. No peer-authority case in v1.

**Conclusion:** Every v1 artifact is resolvable. Multi-authority delegation is named, honestly excluded by scope, and raises a question when encountered — never silently resolved. No v1 artifact requires peer-authority resolution the lattice cannot provide.

---

### Check 2 — Plan language consistently narrowed to "directional, single-authority"

**Finding: PASS with one minor tightening recommendation.**

**Consistent language throughout:**
- **§2:** "For the intent domain... the intent invariant is **directional**... exactly as strong as the actor-lattice analysis in §3.3 — no stronger."
- **§3.3:** "Intent-domain status is **DIRECTIONAL, not closed**."
- **§3.5:** Intent status = "**Directional** (single-authority); multi-authority `authority` = open breaker, scoped out."
- **§9 Phase 0:** "Draft the constitution in **hypothesis** language: ...intent directional, single-authority, multi-authority `authority` open and scoped out."
- **§9 Phase 0 work item:** "Narrow all plan language to 'directional, single-authority' for the intent domain."

**Note on §4.5:** The sentence "The **constraint-precedence solver** resolves conflicts deterministically by (actor-lattice, scope-specificity, recency, anchoring-mode)" uses the word "deterministically" without restating the single-authority scope qualifier in that paragraph. However, the *very next sentence* correctly handles the boundary: "Equal-authority peer conflict with no lattice edge → **salience event (a question), never a silent pick** (= the `authority` open problem, §3.3)." So the scope is bounded correctly in context. This is the tightest passage in the plan — fully correct but could be read in isolation as claiming general deterministic resolution.

**Recommendation (minor):** Add a single qualifying adverb to the §4.5 sentence — e.g., "resolves conflicts **within v1 single-authority scope** deterministically by..." — to make the scope self-evident even to a reader who jumps to that section.

**No instances of implied closure found.** Every claim about constraint resolution, convention handling, and intent processing is bounded by the directional/single-authority framing established in §3.3.

---

### Check 3 — Actor-precedence lattice design sufficiently defined to be checkable

**Finding: PASS.** The lattice is checkable at the logical and test level.

**Declared hierarchy (§3.3(A)):**
```
safety-substrate                   (highest; never overridable)
    >  user-global-constraint      (the user's standing rules)
    >  project-template-constraint (imported / template-imposed)
    >  session-prompt-constraint   (the current ambiguous prompt)
```

**Persona resolution:** Sub-actor namespaces under `user-global` with explicit, user-set ordering.

**Precedence tuple:** (actor-lattice, scope-specificity, recency, anchoring-mode).

**Boundary case:** Equal-authority peer conflict → salience event (question), never silent pick.

**What is checkable now:**
- The hierarchy is total over v1's actor set — every single-user conflict has a path through the lattice.
- Persona ordering is user-defined and explicit — testable as "does the system respect the user's stated persona priority?"
- The precedence tuple is clearly declared — a test can verify the solver applies these dimensions in order.

**What is implementation-defined (acceptable for Phase 0 — gated at G4):**
- How `scope-specificity` is measured (lexical depth? numeric specificity score?)
- How `recency` interacts with lattice level (does recency ever override lattice rank, or only within the same lattice level?)
- The exact semantics of `anchoring-mode` in the precedence tuple (sample-time vs musical-time vs relational)

**G4 gate covers this fully:** "Does the actor lattice deterministically resolve a persona/template/safety conflict, and raise a question (not silently pick) on an equal-authority conflict?" — this is the empirical test that converts the §3.3 paper design into evidence.

---

### Check 4 — Any v1 artifact requiring the `authority` open breaker

**Finding: PASS. None.**

The `authority` open breaker (§3.3(B)) is defined as:

> "multi-authority delegation / equal-authority cross-actor conflict with no lattice edge — i.e., two *peer* authorities (true collaboration, or a delegated authority transfer) asserting contradictory constraints with no precedence rule deriving from the lattice."

**Every v1 artifact examined:**
1. **Reference** — no authority dimension; identity is for regeneration survival, not conflict resolution.
2. **Revision** — carries `actor` as provenance only; single-authority branching is the only v1 case.
3. **Convention** — evidence-weighted, context-tagged; contradictions resolved by evidence weight + context + time-decay, not authority resolution.
4. **Constraint** — the only primitive with an authority dimension, and v1 limits it to single-authority. The four cases (persona-vs-persona, template-vs-prompt, safety-vs-user, prior-vs-later) all have lattice-defined resolution paths. No v1 constraint conflict requires peer-authority.
5. **Conflicting timebases** — resolved by the precedence solver, not authority.
6. **Provenance / rationale** — metadata on revision; no authority needed.

The only case that *would* require the open breaker is multi-user collaboration, which is explicitly scoped out of v1 (§3.3: "v1 excludes it (single-authority only; collaboration is post-v1)"). This is an honest scope cut, not a hidden assumption.

---

## Summary

| Check | Result | Detail |
|---|---|---|
| 1. All v1 artifacts resolvable by lattice | **PASS** | Every artifact class reduces within single-authority scope; multi-authority delegation is honestly scoped out |
| 2. Language narrowed to directional, single-authority | **PASS** (~1 minor tightening) | Consistent throughout; §4.5 "deterministically" is context-correct but could be scoped inline |
| 3. Lattice design sufficiently defined to be checkable | **PASS** | Hierarchy declared, precedence tuple specified, boundary case defined; G4 gate provides empirical test |
| 4. No v1 artifact requires the `authority` open breaker | **PASS** | None identified; multi-authority cases are post-v1 by scope |

---

## Recommendation

**G0 should pass.** No structural blocker prevents proceeding to Phase 1.

**Recommended actions before closing G0:**
1. **§4.5 language tightening (optional but recommended):** Add a single phrase — e.g., "**within v1 single-authority scope**" — to the `constraint-precedence solver` sentence so the directional qualification is self-evident in every section without context-hunting.
2. **Record the verdict** as evidence that C3-Finding-13's G0 objection is closed: the plan is directional and single-authority-consistent, and the §3.3 scope cut is explicit and decision-forcing.
3. **Proceed to Phase 1** (both tracks) with the intent scale carried as a **directional hypothesis** — re-gated at G4/G5 as the plan states.

---

*Written per BUILD-PLAN.md §3.3, §9 Phase 0, §12. Verifier role: G0 scope check. Engram topic saved.*
