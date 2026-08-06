# Prompt principles

These are production heuristics, not magic words.

## 1. Open with the subject and the visible action

The first sentence should answer: who/what is on screen, what is it doing, and where is it? Put decorative style later.

Weak:

> cinematic, premium, emotional, beautiful ad, volumetric light...

Stronger:

> A matte green aluminum bottle stands on a dark stone plinth. Condensation moves slowly down the surface while the camera performs a controlled 20-degree clockwise orbit.

## 2. Every reference has one job

A reference is not “inspiration”. Bind it explicitly:

- `@Image1` = exact product identity
- `@Image2` = lighting/material response only
- `@Video1` = camera path only
- `@Video2` = motion/physics only
- `@Audio1` = timing/tempo only

If two references fight over the same property, remove one or state priority.

## 3. One dominant action per shot

Seedance can perform complex scenes, but reliability drops when the subject must perform several unrelated verbs while the camera also performs several moves. Prefer one action with one physical endpoint.

## 4. Time-code real beats

Use explicit timing when there is a sequence:

```text
[0-2s] Macro detail. Condensation moves across the surface.
[2-5s] Camera widens and makes a slow clockwise orbit.
[5-7s] Product stops center frame; light settles; low impact lands in audio.
```

If you need five or six independent beats, use several clips.

## 5. Specify the endpoint

The end state is often more useful than another style adjective:

- hand rests on the table;
- product centered and perfectly upright;
- character stops at the doorway and looks left;
- camera settles into a symmetrical medium shot.

A clear endpoint reduces unmotivated movement near the end.

## 6. Direct the camera as a physical system

Use:

- shot size;
- camera height/angle;
- support: locked tripod, handheld, gimbal, dolly;
- one primary movement;
- movement speed;
- endpoint.

Avoid stacking `orbit + dolly + crane + zoom + whip pan` unless the scene genuinely needs it.

## 7. Lighting must describe cause, not only mood

Prefer “large soft source from camera-left, weak warm edge behind product” over “cinematic luxury lighting”.

## 8. Sound should be event-linked

Tie critical audio to visible events. Do not ask for ten simultaneous layers. Generate music separately when exact structure or rights-controlled music matters.

## 9. Keep graphics out of the generative critical path

Use Seedance for the moving plate. Composite exact:

- logos;
- slogans;
- pack copy;
- legal text;
- UI;
- subtitles;
- QR codes.

## 10. Positive locks beat a giant negative-prompt dump

Instead of listing dozens of negatives, state what must remain stable:

- face geometry remains consistent;
- hands remain natural and relaxed;
- product proportions remain identical to the reference;
- frame remains text-free;
- camera movement remains smooth and physically plausible.

## 11. Retake surgically

If 80% works, keep it. Change the weakest variable only. Rewriting the entire prompt destroys useful causal information.
