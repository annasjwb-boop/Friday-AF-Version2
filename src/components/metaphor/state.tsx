import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import {
  HOME_STATE_KEYS,
  type HomeStateParams,
} from "./types";

const HomeStateContext =
  createContext<RefObject<HomeStateParams> | null>(null);

/**
 * Holds the live, frame-damped copy of the five state parameters so tab
 * switches and score changes ease into place instead of snapping. Consumers
 * read `ref.current` inside their own `useFrame` callbacks.
 */
export function HomeStateProvider({
  target,
  children,
}: {
  target: HomeStateParams;
  children: ReactNode;
}) {
  const targetRef = useRef(target);
  targetRef.current = target;
  const smoothed = useRef<HomeStateParams>({ ...target });

  useFrame((_, delta) => {
    const current = smoothed.current;
    const goal = targetRef.current;
    for (const key of HOME_STATE_KEYS) {
      current[key] = MathUtils.damp(current[key], goal[key], 2.4, delta);
    }
  });

  return (
    <HomeStateContext.Provider value={smoothed}>
      {children}
    </HomeStateContext.Provider>
  );
}

export function useSmoothedHomeState(): RefObject<HomeStateParams> {
  const context = useContext(HomeStateContext);
  if (!context) {
    throw new Error(
      "useSmoothedHomeState must be used within HomeStateProvider",
    );
  }
  return context;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
