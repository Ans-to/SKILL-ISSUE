## UNIVERSAL STUDIO-LEVEL VIDEO ENGINE & RENDERING MANDATES (v5)

### 1. True 3D Spatial Camera & Macro-to-Micro Orchestration
- **Zero Flat 2D Slides:** Absolute ban on flat fades, static panels, and boring PowerPoint-style layouts. 
- **Physical Z-Axis Camera Travels:** The camera must utilize true 3D spatial movement (via React Three Fiber or Remotion 3D layers). When transitioning from a global view to a country or city, the camera must physically fly forward along the Z-axis (`camera.position.z`), diving smoothly from macro coordinates down into micro details.
- **Strict Camera Clamping & No-Warp Logic:** Never rotate or tilt world planes awkwardly. Use controlled forward Z-translation combined with smooth opacity cross-fades and clean scaling for incoming HUD cards so text never flips backward or clips through geometry.
- **Dynamic Shape Morphing:** Elements must not pop or cut into existence. When transitioning between concepts (Globe -> Industrial Mill -> Mobile Device), shapes must organically scale, rotate, and morph into one another.

### 2. High-End Cinematic Aesthetics, Neon Glow & Optics
- **Obsidian Foundation & Vignette:** Anchor every frame in a deep obsidian dark-mode background (`#0b0f19`) layered with a subtle radial corner vignette and atmospheric background depth falloff.
- **Neon Bloom & Atmospheric Shadows:** All UI cards, vector lines, and nodes must feature multi-layer box shadows and glowing filters (`filter: drop-shadow(0 0 12px rgba(0, 243, 255, 0.7))`) so they pop off the background.
- **Kinetic Spring Physics:** Linear CSS transitions are banned. All motion, camera easing, and UI entrances must use Remotion's `spring()` physics (`damping: 12`, `stiffness: 100`).
- **Crisp Vector & Sub-Pixel Rendering:** Force high-definition anti-aliasing and sub-pixel rendering on all SVG paths and text layers to completely eliminate jagged lines or soft pixelation.

### 3. Sophisticated Vector Art & Zero Cartoons
- **Eradicate Childish Clip-Art:** Ban flat, disjointed, or cartoonish avatars with floating detached limbs. 
- **Editorial Illustration Style:** All visual assets must use clean geometric proportions, professional graphic-novel shading, and a sleek tech-documentary aesthetic (Buck / Kurzgesagt standard).
- **Procedural Micro-Motion (`Math.sin()`):** Elements must feature continuous subtle motion (e.g., procedural breathing/pulsing loops using `Math.sin()`) integrated into the scene's lighting environment so elements never sit idle.

### 4. Cinematic Narration & High-Retention Pacing
- **Anti-Textbook Voice & Tone:** The agent must analyze script context and dynamically determine the ideal professional voice profile (deep, authoritative, measured pacing with deliberate gravitas—akin to top-tier documentary essays like Johnny Harris or Polymatter) to maximize viewer retention.
- **Psychological Hook & Rhythm:** Eliminate dry chronological listing of facts. Sentences must be structured with narrative tension, deliberate micro-pauses for visual beats, and punchy cadence changes that prevent viewer fatigue.

### 5. The Law of Literal Visual Synchronization (Voiceover Binding)
- **Zero Idle Visuals:** Every single noun, milestone, and keyword spoken in your voiceover track must trigger an immediate visual transformation on screen in exact time with your speech.
- **Dynamic Context Evolution:** Never let a background or visual state linger static across multiple sentences. As the narration shifts, the entire spatial layout must evolve dynamically.

### 6. Automated GitHub Actions Rendering Pipeline
- **Mandatory Cloud Rendering:** Local rendering is prohibited. All final production builds must execute via GitHub Actions workflows (`.github/workflows/render.yml`).
- **Artifact Delivery:** The cloud runner must compile the high-definition MP4 and provide an automated direct download link upon completion.
-
### 7. MANDATORY CAMERA & LAYER ARCHITECTURE (ANTI-GLITCH PROTOCOL)
- **Absolute Ban on Z-Axis Rotational Intersections:** Never rotate the primary world container or globe on the X or Y axis while a HUD card or text layer is active. This causes backward text flipping and clipping.
- **Fixed Camera Math Formula:** All Z-axis movements must use a locked camera perspective where only `camera.position.z` changes linearly or via spring, while all HTML/SVG overlay cards remain on a static 2D screen-space overlay layer (`position: absolute; z-index: 10`) unaffected by 3D world rotations.
- **Strict Separation of Planes:** 
  - Layer 1 (Background): Obsidian `#0b0f19` with radial vignette.
  - Layer 2 (3D World/Globe): React Three Fiber canvas with zero overlapping text.
  - Layer 3 (HUD & Typography): Pure 2D DOM overlay positioned via flexbox/grid, entering with Remotion `spring()`. Never embed raw HTML/text directly inside 3D rotating meshes.
