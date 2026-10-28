## UNIVERSAL STUDIO-LEVEL VIDEO ENGINE & RENDERING MANDATES (v2)

### 1. True 3D Spatial Camera & Macro-to-Micro Orchestration
- **Zero Flat 2D Slides:** Absolute ban on flat fades, static panels, and boring PowerPoint-style layouts. 
- **Physical Z-Axis Camera Travels:** The camera must utilize true 3D spatial movement (via React Three Fiber or Remotion 3D layers). When transitioning from a global view to a country or city, the camera must physically fly forward along the Z-axis (`camera.position.z`), diving smoothly from macro coordinates down into micro details.
- **Dynamic Shape Morphing:** Elements must not pop or cut into existence. When transitioning between concepts (e.g., Globe -> Industrial Mill -> Mobile Device), shapes must organically scale, rotate, and morph into one another.

### 2. High-End Cinematic Aesthetics, Glow & Lighting
- **Obsidian Foundation & Neon Bloom:** Anchor every frame in a deep obsidian dark-mode background (`#0b0f19`) paired with high-contrast, glowing neon vector paths.
- **Atmospheric Glow & Shadows:** All UI cards, vector lines, and nodes must feature multi-layer box shadows and glowing filters (`filter: drop-shadow(...)` / neon bloom) so they pop off the background with a high-end Netflix/Polymatter sheen.
- **Kinetic Spring Physics:** Linear CSS transitions are banned. All motion, camera easing, and UI entrances must use Remotion's `spring()` physics (`damping: 12`, `stiffness: 100`).

### 3. Sophisticated Vector Art & Zero Cartoons
- **Eradicate Childish Clip-Art:** Ban flat, disjointed, or cartoonish avatars with floating detached limbs. 
- **Editorial Illustration Style:** All visual assets must use clean geometric proportions, professional graphic-novel shading, and a sleek tech-documentary aesthetic (Buck / Kurzgesagt standard).
- **Procedural Micro-Motion:** Elements must feature continuous subtle motion (e.g., procedural breathing/pulsing using `Math.sin()`) integrated into the scene's lighting environment.

### 4. The Law of Literal Visual Synchronization (Voiceover Binding)
- **Zero Idle Visuals:** Every single noun, milestone, and keyword spoken in your voiceover track must trigger an immediate visual transformation on screen in exact time with your speech.
- **Dynamic Context Evolution:** Never let a background or visual state linger static across multiple sentences. As the narration shifts, the entire spatial layout must evolve dynamically.

### 5. Automated GitHub Actions Rendering Pipeline
- **Mandatory Cloud Rendering:** Local rendering is prohibited. All final production builds must execute via GitHub Actions workflows (`.github/workflows/render.yml`).
- **Artifact Delivery:** The cloud runner must compile the high-definition MP4 and provide an automated direct download link upon completion.
-
