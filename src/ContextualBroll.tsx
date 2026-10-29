import React from 'react';
import {
  ContextualUiSimulationLayer,
  SCENE_UI_CLAUSES,
  classifyUiSimulationKeyword,
  getActiveUiSimulation,
  type ActiveUiSimulationState,
  type SceneUiClauseSpec,
  type UiSimulationKind,
} from './ContextualUiSimulation';
import {CRIMSON} from './EmotionalPacing';
import {ORANGE, normalize, type SceneSpec} from './engine/agentEngineModel';

export {
  ContextualUiSimulationLayer,
  SCENE_UI_CLAUSES,
  classifyUiSimulationKeyword,
  getActiveUiSimulation,
  type ActiveUiSimulationState,
  type SceneUiClauseSpec,
  type UiSimulationKind,
};

export type BrollKind = 'neural' | 'syntax' | 'math';

/**
 * Preserved semantic token classifier for backward-compatible verification checks.
 */
export const classifyBrollKeyword = (rawWord: string): BrollKind | null => {
  const token = normalize(rawWord);
  if (token === 'ai' || token === 'agent' || token === 'agents') return 'neural';
  if (
    token === 'code' ||
    token === 'codebase' ||
    token === 'codebases' ||
    token === 'prompt' ||
    token === 'prompts' ||
    token === 'template' ||
    token === 'templates'
  ) {
    return 'syntax';
  }
  if (token === 'physics' || token === 'timing' || token === 'easing') return 'math';
  return null;
};

/**
 * 2D Contextual UI Simulation Stage mounted inside <SceneStage>.
 */
export const ContextualVectorBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => (
  <ContextualUiSimulationLayer scene={scene} localFrame={localFrame} />
);

/**
 * Decoupled 3D WebGL tactical horizon rails aligned behind the Upper Focal Card (y=120..672)
 * and Lower-Third UI Simulation Dock (y=1144..1776).
 * Strictly coupled to the active UI simulation state (zero random orbital rings or dot loops).
 */
export const ContextualThreeBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const sim = getActiveUiSimulation(scene, localFrame);
  if (!sim) return null;

  const color = sim.kind === 'error-diagnostic' ? CRIMSON : ORANGE;
  const upperRailY = ((960 - 672) / 960) * 5.25;
  const lowerRailY = ((960 - 1144) / 960) * 5.25;
  const spanW = 4.4 * (0.28 + sim.clauseProgress * 0.72);

  return (
    <group>
      <mesh position={[-2.2 + spanW * 0.5, upperRailY, -1.2]}>
        <boxGeometry args={[Math.max(0.02, spanW), 0.014, 0.01]} />
        <meshBasicMaterial color={color} transparent opacity={0.32 * sim.cardReveal} />
      </mesh>
      <mesh position={[-2.2 + spanW * 0.5, lowerRailY, -1.2]}>
        <boxGeometry args={[Math.max(0.02, spanW), 0.014, 0.01]} />
        <meshBasicMaterial color={color} transparent opacity={0.28 * sim.cardReveal} />
      </mesh>
    </group>
  );
};
