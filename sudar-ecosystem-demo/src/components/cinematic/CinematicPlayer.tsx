"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DemoCursor } from "@/components/demo/DemoCursor";
import { WireframeScene } from "@/components/wireframes/WireframeScenes";
import {
  getFrameAudioCue,
  launchFrames,
  mergeLaunchSceneState,
  totalLaunchDurationMs,
  type SceneFrame,
} from "@/data/launchDemo";
import { resumeAudioContext } from "@/lib/cinematicAudio";
import { CinematicBackdrop } from "./CinematicBackdrop";
import { Scene3DStage } from "./Scene3DStage";
import { TitleCard } from "./TitleCard";
import { TextOverlay } from "./TextOverlay";
import { useCinematicAudio } from "./useCinematicAudio";
import { VideoControls } from "./VideoControls";

const CONTROLS_HIDE_MS = 2500;

type CinematicPlayerProps = {
  autoPlay?: boolean;
};

export function CinematicPlayer({ autoPlay = true }: CinematicPlayerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const frame = launchFrames[frameIndex];
  const totalFrames = launchFrames.length;
  const audioCue = frame ? getFrameAudioCue(frame) : undefined;

  useCinematicAudio(frameIndex, audioCue, playing, soundEnabled);

  const elapsedBeforeMs = useMemo(
    () => launchFrames.slice(0, frameIndex).reduce((sum, f) => sum + f.durationMs, 0),
    [frameIndex]
  );

  const progressWithCurrent = useMemo(() => {
    if (!frame) return 0;
    return ((elapsedBeforeMs + frame.durationMs * 0.5) / totalLaunchDurationMs) * 100;
  }, [elapsedBeforeMs, frame]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  }, []);

  const advance = useCallback(() => {
    setFrameIndex((i) => {
      if (i >= totalFrames - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [totalFrames]);

  const handlePlayPause = useCallback(() => {
    resumeAudioContext();
    if (frameIndex >= totalFrames - 1) {
      setFrameIndex(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
    showControls();
  }, [frameIndex, totalFrames, showControls]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  useEffect(() => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (!playing || !frame) return;

    advanceTimerRef.current = setTimeout(advance, frame.durationMs);
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [playing, frame, frameIndex, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePlayPause]);

  if (!frame) return null;

  const frameKey = `${frame.id}-${frameIndex}`;

  return (
    <div
      className="relative min-h-screen w-full bg-[#050505] overflow-hidden"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <CinematicBackdrop />

      <AnimatePresence mode="wait">
        <motion.div
          key={frameKey}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {frame.type === "title-card" ? (
            <TitleCard
              eyebrow={frame.eyebrow}
              headline={frame.headline}
              subhead={frame.subhead}
              showLogo={frame.showLogo}
              logoOnly={frame.logoOnly}
            />
          ) : (
            <SceneFrameView frame={frame} frameKey={frameKey} />
          )}
        </motion.div>
      </AnimatePresence>

      <VideoControls
        visible={controlsVisible}
        playing={playing}
        progress={progressWithCurrent}
        soundEnabled={soundEnabled}
        onPlayPause={handlePlayPause}
        onToggleSound={() => {
          resumeAudioContext();
          setSoundEnabled((s) => !s);
          showControls();
        }}
      />
    </div>
  );
}

function SceneFrameView({ frame, frameKey }: { frame: SceneFrame; frameKey: string }) {
  const sceneState = mergeLaunchSceneState(frame);

  return (
    <div className="absolute inset-0 flex flex-col overflow-visible">
      <div className="relative flex-1 min-h-0 pt-[3vh] sm:pt-[5vh] pb-[4vh] overflow-visible">
        <Scene3DStage frameKey={frameKey}>
          <div className="relative w-full">
            <WireframeScene id={frame.scene} state={sceneState} cinematic />
            <DemoCursor hotspot={frame.hotspot} action={frame.action} stepKey={frameKey} />
          </div>
        </Scene3DStage>
      </div>
      <TextOverlay
        eyebrow={frame.overlay.eyebrow}
        headline={frame.overlay.headline}
        body={frame.overlay.body}
      />
    </div>
  );
}
