# UNIVERSAL STUDIO-LEVEL VIDEO ENGINE & RENDERING MANDATES — v7.0

## 1. High-Retention Cinematic Visual Standards
- **Zero Boring Layouts:** Avoid flat slides, static icons, and predictable corporate templates. Every sequence should feel like a high-end documentary essay, designed for visual momentum and narrative clarity.
- **Macro-to-Micro Spatial Orchestration:** Use continuous, smooth camera motion to move between geographic context, places, materials, and intimate objects. Preserve a fixed lens unless a lens change is narratively motivated; prefer true camera dolly and object-space motion.
- **Kinetic Data & Spring Physics:** UI entrances, callouts, and typographic reveals use Remotion `spring()` physics (`damping: 12`, `stiffness: 100`) or other continuous, deterministic easing. Avoid abrupt linear state changes.
- **Obsidian Cinematic Foundations:** Use deep obsidian foundations (`#0b0f19`), restrained neon accents, layered lighting, dimensional shadows, and sophisticated glassmorphism with readable contrast.

## 2. Studio-Grade Objects, Materials & Lighting
- **No Generic Placeholder Art:** Avoid unfinished primitives, flat ovals, repetitive iconography, or unmotivated geometry. Build assets from layered, detailed geometry, custom vector work, purposeful material choices, and scene-specific lighting.
- **Sophisticated Editorial Illustration:** Keep proportions considered and materials tactile. Use custom silhouettes, bevels, fine linework, translucent layers, and controlled highlights rather than default primitive-only assemblies.
- **Procedural Motion & Depth:** Add restrained micro-motion, atmospheric particles, contact shadows, ambient occlusion, and directional rim light where they support the story. Keep effects deterministic for frame-by-frame rendering.

## 3. Cinematic Geographic & Spatial Engine
- **Spatially Motivated Camera:** When geography matters, move smoothly from world to region to place and object. Clamp camera bounds, preserve a predictable aim, and do not warp perspective to fake a dolly.
- **Geographic Visuals:** Use programmatic maps, globes, route geometry, coordinate nodes, and contextual data visualizations. Place all labels in the independent 2D editorial layer unless the narrative specifically requires spatial text.
- **Clean 3D-to-2D Separation:** Keep the 3D world and the typography/HUD overlay in separate render layers. Overlay text must remain front-facing, legible, and independent of scene-camera rotations.

## 4. Concept-First Narrative and Audio Momentum (v7.0)
- **Do Not Treat the Script as a Rigid Timeline:** Do not assign one literal visual to every word or force every sentence into a fixed timestamp grid. First interpret the narrative, identify its central argument, emotional turns, places, entities, and visual metaphors.
- **Programmatic Concept Extraction:** Parse the script/transcript into a compact set of semantic concepts and relationships (for example: origin → material → transformation → network → consequence). Use those concepts to select or synthesize visual motifs, motion-graphic structures, and typographic emphasis.
- **Narrative-Led, Not Word-Led:** Visuals may anticipate, overlap, and resolve concepts across adjacent phrases. Preserve the argument and factual meaning while allowing an editorial rhythm; do not invent unsupported claims or literalize every noun.
- **Audio-Momentum Mapping:** Use the supplied narration/music as the timing authority. Derive or author a deterministic audio-energy/envelope map and use it to modulate motion intensity, particle activity, camera acceleration, signal pulses, and typography. Let pauses breathe; reserve strong reveals and kinetic accents for emphasis, transitions, and cadence.
- **Semantic Spring Reveals:** Trigger concept callouts and headline emphasis when the corresponding idea emerges in the audio. Use spring physics and eased overlaps rather than hard cuts or rigid per-caption animation resets.
- **No Idle Decoration:** Every graphic, node, map, particle field, and callout must reinforce the current concept or emotional beat. Remove any visual system that becomes an unrelated persistent wallpaper.

## 5. Local Rendering & GitHub Delivery
- **Local Final Render:** Final MP4 renders may and should be produced locally when requested. Use the maximum concurrency supported by the installed Remotion version (`--concurrency=100%` if that version does not accept the literal `max` value). Never run a render with an invalid CLI option.
- **Verify Before Publishing:** Typecheck and inspect the composition, run the local final render, verify the MP4 is readable and has the intended duration/resolution/audio, and check the final file size before publishing.
- **Publish the Deliverable to GitHub:** Push source changes only to the active Arena branch. Publish the final MP4 as a downloadable GitHub Release asset or an Actions artifact; do not add generated media to Git unless explicitly requested. Share a working download link after upload.
- **Artifact Hygiene:** Keep scratch files and temporary render intermediates out of Git. Use the repository’s ignore rules and preserve reproducible render settings.
