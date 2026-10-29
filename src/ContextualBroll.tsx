import React from 'react';
import {
  ASSET_TRANSITION_FRAMES,
  ConnectedContextualUiSimulation,
  ContextualUiSimulationLayer,
  SCENE_UI_CLAUSES,
  classifyUiSimulationKeyword,
  computeAssetTransition,
  getActiveUiSimulation,
  getActiveUiSimulations,
  type ActiveUiSimulationState,
  type AssetTransitionEnvelope,
  type SceneUiClauseSpec,
  type UiSimulationKind,
} from './ContextualUiSimulation';
import {CRIMSON} from './EmotionalPacing';
import {ORANGE, normalize, type SceneSpec} from './engine/agentEngineModel';

export {
  ASSET_TRANSITION_FRAMES,
  ConnectedContextualUiSimulation,
  ContextualUiSimulationLayer,
  SCENE_UI_CLAUSES,
  classifyUiSimulationKeyword,
  computeAssetTransition,
  getActiveUiSimulation,
  getActiveUiSimulations,
  type ActiveUiSimulationState,
  type AssetTransitionEnvelope,
  type SceneUiClauseSpec,
  type UiSimulationKind,
};

export type BrollKind = 'neural' | 'syntax' | 'math';

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

export const ContextualVectorBroll: React.FC<{
  scene: SceneSpec;
  localFrame?: number;
}> = ({scene, localFrame}) =>
  localFrame !== undefined ? (
    <ContextualUiSimulationLayer scene={scene} localFrame={localFrame} />
  ) : (
    <ConnectedContextualUiSimulation scene={scene} />
  );

export const ContextualThreeBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const sims = getActiveUiSimulations(scene, localFrame);
  if (sims.length === 0) return null;

  const upperRailY = ((960 - 672) / 960) * 5.25;
  const lowerRailY = ((960 - 1144) / 960) * 5.25;

  return (
    <group>
      {sims.map((sim) => {
        const color = sim.kind === 'error-diagnostic' ? CRIMSON : ORANGE;
        const spanW = 4.4 * (0.28 + sim.clauseProgress * 0.72) * sim.envelope.scale;
        return (
          <group key={sim.id}>
            <mesh position={[-2.2 + spanW * 0.5, upperRailY, -1.2]}>
              <boxGeometry args={[Math.max(0.02, spanW), 0.014, 0.01]} />
              <meshBasicMaterial color={color} transparent opacity={0.32 * sim.envelope.opacity} />
            </mesh>
            <mesh position={[-2.2 + spanW * 0.5, lowerRailY, -1.2]}>
              <boxGeometry args={[Math.max(0.02, spanW), 0.014, 0.01]} />
              <meshBasicMaterial color={color} transparent opacity={0.28 * sim.envelope.opacity} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
