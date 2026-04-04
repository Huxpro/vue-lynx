See if we can build an experimental `lynx-stack.dev/vue` subsite for `experimental/vue` branch

## Overall

drop as much "lepus" and "worklet" as possible.

## entry-main.ts

- Extract the `mts-draggable-raw` demo worklet and related logic to a **test** file
- remove `mts-demo`

## ops-apply.ts

-> **Tracked in `.plans/08-ops-apply-split.md`**

## Source code wise

-> **Tracked in `.plans/08-ops-apply-split.md`** (Step 0: `vue-lynx/internal/ops` shared package)

## Getting Started

Patch the `community-cli` or `sparkling` to create native Apps with template from other places. (We need to replicate the Vue Lynx template)

Run the below prompt to an Agent to start a native app with Sparkling

```sh
```

---

Run the below prompt to an Agent to run with Lynx Go

```sh
```

Agentic Getting Started: "run this f up"

## Element PAPI

- alias `callLepusMethod`
  - starting from source of VueLynx then Element PAPI and React

## Research

### Asking Claude to generate a spec then we use Remotion to generate video

explain how things work

### Does Vue DevTool work???

### Template `ref` should return Lynx's `NodeRef`? DOM Query API

### Dual-Thread Semantic Drift

- `v-model`: `:v-main-thread-model = {mtRef}`?
- `onMounted`

queuePostFlushCb

### Single-threaded official "react" on Lynx

More branding support than "preact"

Preact doesn't have a custom renderer?

- My testing purpose is to use it for DOM shim?

Let open claw to

- create one claude to study Vue/Preact impl and generate a plan with different phases
- create multiple claude to detail each phase, and a test plan (tester)
- implement them one by one.
- initiate another agent with original phased plan to review the whole code
- let the tester test the things.

### Compare the "Block + ShadowElement" vs ReactLynx's Snapshot

Vue already has Block, which saves us the Snapshot work - Block is 1st-class. In ReactLynx we need to hack preact to make it aware that Snapshot is a first-class citizen.

Compilation

- Vue Block: BG ops once; Slot patches later
- RL Snapshot: MT-SI IFR; Slot patches later

VDOM

- OPs -> Element PAPI

Question: can ReactLynx be implemented by this ShadowElement and would it be slower

- Vue: VDOM -> Blocks -> ShadowElement
- RL: VDOM -> Snapshot

- Block Tree is internalized in Vue's VDOM, Snapshot is externally attached
  Snapshot is Block/ShadowElement 2-in-1 (should it be split? Implications for ElementTemplate)?

```
Dual-write strategy: each operation does two things simultaneously:

Synchronously updates the lightweight tree structure on the BG side (maintaining parent/child/sibling pointers, supporting queries)
Appends to the patch array (a flat unknown[], sent in batch to Main Thread after reconciliation is complete)
```

We are working on standardizing this concept for future framework devs.

### The following can all be easily reused, and are naturally suited for IPC

Patch Flags: Vue's compiler marks which nodes are dynamic. Static subtrees only need to send create ops once; subsequent updates never generate corresponding ops - naturally reducing cross-thread traffic.

Block Tree: Vue 3's Block Tree optimization makes diff only compare dynamic nodes. Combined with the cross-thread protocol, this means the number of operations is directly proportional to "the number of actually changed nodes," not "the size of the entire tree."

Static Hoisting: Create ops for static nodes can be sent in batch during initialization, and they are completely excluded from the update process afterwards.

Vue's static hoisting optimization reuses VNode references across renders, which means the patch function skips them entirely—no nodeOps calls get made for static nodes during updates, so no operations are generated and there's no cross-thread communication needed. This actually works seamlessly with the custom renderer.

The block tree optimization also plays nicely here since it restricts reconciliation to only dynamic children, which naturally means only dynamic nodes trigger nodeOps calls and generate operations. The trickier piece is `insertStaticContent`, which Vue uses to inject pre-compiled static HTML via innerHTML in the DOM renderer. For Lynx, I'd either need to skip this optimization and fall back to creating elements individually, or implement a different approach—but since it's optional, Vue functions fine without it.

### RN

- compare with React Native
  - the `ops buffer` architecture
  - Shadow Tree overhead?
    - same concept:
      - VDOM + Shadow Tree live in the JS thread, then handover to main thread
    - RN:
      - React VDOM shadow create C++ shadow tree via JSI, then handover the C++ tree
    - Here
      - Vue VDOM shadow create shadowElement in JS heap, then handover the ops.
        then give the ops to MTS tree on main thread.
  - threading
    - RN also does not run JS/React on the UI thread, guess why?

- compare Main-Thread Vue vs. Dual-threaded Vue on perf implications
  - notably on mobile with native UI being heavier (than browser)

## Thoughts (suitable for "Lynx Architecting Notes")

This pattern of converting synchronous calls into `stack.insertOps` form has appeared
countless times in PLT/Compiler.
What is this behavior called?

It feels like going from interpreting to compiling, feels like a kind of JIT?
basically BG JIT opcode -> send opcode -> interpret opcode

So the MTS side is actually a UIop VM!

## Scientific Research

I want to know

- cross-thread communication overhead
- rendering overhead

and the relationship between them

## Scientific Research

React MT vs Preact MT vs RL IFR

## `lynx-stack` doesn't get enough traffic, I think the best name would be `lynx-js` ...

[RFC] The JavaScript layer of Lynx.
