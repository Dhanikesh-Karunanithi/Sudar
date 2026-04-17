import type { ReferenceBust } from "./schema";

/**
 * Waist-up “reference bust” from sample CSS: --rb-u scales all measures (sample used vw).
 * Jacket width = 40u → 320px when u=8px.
 */
export function compileReferenceBust(spec: ReferenceBust): { html: string; css: string } {
  const {
    themeColor,
    backgroundColor,
    animation,
    skinTone,
    skinShadow,
    hairColor,
    jacketColor,
    teeColor,
    buttonColor,
    eyebrowColor,
    pupilColor,
    teethColor,
    mouthColor,
    tongueColor,
    tongueShadow,
    capBrimColor,
    capReflectColor,
    headwear,
    eyewear,
    mouthStyle,
    topType,
  } = spec;

  const showCap = headwear === "cap";
  const showGlasses = eyewear === "glasses";
  const openMouth = mouthStyle === "open-smile";
  const jacketTee = topType === "jacket-tee";

  const capHtml = showCap
    ? `<div class="rb-cap" aria-hidden="true"></div>
      <div class="rb-cap-brim" aria-hidden="true"></div>`
    : `<div class="rb-hair-mass" aria-hidden="true"></div>`;

  const glassesHtml = showGlasses
    ? `<div class="rb-eyeglasses" aria-hidden="true">
        <div class="rb-glass-circle">
          <div class="rb-glass">
            <div class="rb-glass-reflect"></div>
          </div>
        </div>
        <div class="rb-glass-circle">
          <div class="rb-glass">
            <div class="rb-glass-reflect"></div>
          </div>
        </div>
      </div>`
    : "";

  const mouthInnerHtml = openMouth
    ? `<div class="rb-mouth rb-mouth-open" aria-hidden="true"></div>`
    : `<div class="rb-mouth rb-mouth-closed" aria-hidden="true"></div>`;

  const buttonsHtml = jacketTee
    ? `<div class="rb-buttons" aria-hidden="true"></div>
      <div class="rb-buttons" aria-hidden="true"></div>
      <div class="rb-buttons" aria-hidden="true"></div>`
    : "";

  const animClass = animation !== "none" ? `anim-${animation}` : "";

  const html = `
<div class="art-container rb-scene ${animClass}">
  <div class="rb-root">
    <div class="rb-man">
      <div class="rb-head">
        <div class="rb-ears" aria-hidden="true"></div>
        <div class="rb-ears" aria-hidden="true"></div>
        <div class="rb-face">
          ${mouthInnerHtml}
          <div class="rb-nose" aria-hidden="true"></div>
          <div class="rb-eye" aria-hidden="true"></div>
          <div class="rb-eye" aria-hidden="true"></div>
          <div class="rb-eyebrows" aria-hidden="true"></div>
          ${glassesHtml}
        </div>
        ${capHtml}
      </div>
      <div class="rb-body">
        <div class="rb-jacket ${jacketTee ? "rb-jacket-tee" : "rb-jacket-sweater"}">
          <div class="rb-tee" aria-hidden="true"></div>
          ${buttonsHtml}
        </div>
      </div>
    </div>
  </div>
</div>
`;

  const css = `
:root {
  --rb-bg: ${backgroundColor};
  --rb-theme: ${themeColor};
  --rb-face: ${skinTone};
  --rb-face-shadow: ${skinShadow};
  --rb-neck: ${skinShadow};
  --rb-hair: ${hairColor};
  --rb-jacket: ${jacketColor};
  --rb-tee: ${teeColor};
  --rb-buttons: ${buttonColor};
  --rb-cap-reflect: ${capReflectColor};
  --rb-cap-shadow: ${skinShadow};
  --rb-cap-bottom: ${capBrimColor};
  --rb-eyebrows: ${eyebrowColor};
  --rb-teeth: ${teethColor};
  --rb-mouth: ${mouthColor};
  --rb-tongue: ${tongueColor};
  --rb-tongue-shadow: ${tongueShadow};
  --rb-nose-shadow: ${skinShadow};
  --rb-eye: ${pupilColor};
  --rb-u: 8px;
}

body {
  margin: 0;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: var(--rb-bg);
  overflow: hidden;
}

.rb-scene {
  width: 100%;
  max-width: 420px;
  min-height: 520px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: calc(var(--rb-u) * 2);
  box-sizing: border-box;
}

.rb-root {
  container-type: inline-size;
  width: 100%;
}

.rb-man {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transform: scale(0.88);
  transform-origin: bottom center;
  margin-bottom: calc(var(--rb-u) * -2);
}

/* --- jacket / torso --- */
.rb-jacket {
  width: calc(var(--rb-u) * 40);
  height: calc(var(--rb-u) * 17);
  border-radius: calc(var(--rb-u) * 8) calc(var(--rb-u) * 8) 0 0;
  background: var(--rb-jacket);
  position: relative;
  display: flex;
  justify-content: center;
}

.rb-jacket-sweater .rb-tee {
  background: var(--rb-jacket);
}

.rb-jacket-sweater .rb-buttons {
  display: none;
}

.rb-tee {
  background: var(--rb-tee);
  width: calc(var(--rb-u) * 18);
  height: calc(var(--rb-u) * 16);
  position: absolute;
  bottom: 0;
}

.rb-tee::after {
  content: "";
  background: var(--rb-neck);
  width: 100%;
  height: calc(var(--rb-u) * 15.5);
  position: absolute;
  top: calc(var(--rb-u) * -7.5);
  border-radius: 0 0 50% 50%;
}

.rb-buttons {
  position: absolute;
  background: var(--rb-buttons);
  width: calc(var(--rb-u) * 1.25);
  height: calc(var(--rb-u) * 1.25);
  border-radius: 50%;
  left: calc(var(--rb-u) * 9);
}

.rb-buttons::after {
  content: "";
  width: calc(var(--rb-u) * 1.25);
  background: var(--rb-buttons);
  height: calc(var(--rb-u) * 0.25);
  position: absolute;
  left: calc(var(--rb-u) * 21);
  top: calc(var(--rb-u) * 0.75);
}

.rb-jacket .rb-buttons:nth-child(2) {
  top: calc(var(--rb-u) * 5);
}

.rb-jacket .rb-buttons:nth-child(3) {
  top: calc(var(--rb-u) * 10);
}

.rb-jacket .rb-buttons:nth-child(4) {
  top: calc(var(--rb-u) * 15);
}

/* --- head --- */
.rb-head {
  z-index: 2;
  display: flex;
  justify-content: center;
  position: relative;
}

.rb-face {
  width: calc(var(--rb-u) * 27);
  height: calc(var(--rb-u) * 30);
  background: var(--rb-face);
  margin-bottom: calc(var(--rb-u) * -1);
  border-radius: 0 0 calc(var(--rb-u) * 15) calc(var(--rb-u) * 15);
  box-shadow: inset calc(var(--rb-u) * -0.5) calc(var(--rb-u) * -1.5) var(--rb-face-shadow);
  position: relative;
  display: flex;
  justify-content: center;
  z-index: 1;
}

.rb-face::before {
  content: "";
  width: 100%;
  height: calc(var(--rb-u) * 3.3);
  background: var(--rb-cap-shadow);
  position: absolute;
  top: 0;
}

.rb-mouth-open {
  width: calc(var(--rb-u) * 13.5);
  height: calc(var(--rb-u) * 4.5);
  background: var(--rb-mouth);
  border-radius: calc(var(--rb-u) * 5);
  position: absolute;
  bottom: calc(var(--rb-u) * 4.75);
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.rb-mouth-open::before {
  content: "";
  background: var(--rb-teeth);
  width: 100%;
  height: calc(var(--rb-u) * 2);
  position: absolute;
}

.rb-mouth-open::after {
  content: "";
  background: var(--rb-tongue);
  width: calc(var(--rb-u) * 5);
  height: calc(var(--rb-u) * 2.25);
  bottom: calc(var(--rb-u) * -1);
  border-radius: 100%;
  box-shadow: inset calc(var(--rb-u) * -1) calc(var(--rb-u) * -0.75) var(--rb-tongue-shadow);
  position: absolute;
}

.rb-mouth-closed {
  width: calc(var(--rb-u) * 10);
  height: calc(var(--rb-u) * 2.5);
  border-radius: 0 0 calc(var(--rb-u) * 4) calc(var(--rb-u) * 4);
  border-bottom: calc(var(--rb-u) * 0.6) solid var(--rb-mouth);
  position: absolute;
  bottom: calc(var(--rb-u) * 6);
}

.rb-nose {
  width: calc(var(--rb-u) * 4.5);
  height: calc(var(--rb-u) * 4.5);
  border-radius: 50%;
  position: absolute;
  top: calc(var(--rb-u) * 13.5);
  box-shadow: inset 0 calc(var(--rb-u) * -0.75) var(--rb-nose-shadow);
}

.rb-eye {
  width: calc(var(--rb-u) * 7);
  height: calc(var(--rb-u) * 7);
  background: #fff;
  border-radius: 50%;
  margin: calc(var(--rb-u) * 6.25) calc(var(--rb-u) * 3) 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.rb-eye::before {
  content: "";
  background: var(--rb-eye);
  width: calc(var(--rb-u) * 3);
  height: calc(var(--rb-u) * 3);
  border-radius: 50%;
}

.rb-eye::after {
  content: "";
  position: absolute;
  top: calc(var(--rb-u) * -1);
  width: 105%;
  height: calc(var(--rb-u) * 4.25);
  background: var(--rb-neck);
  box-shadow: 0 calc(var(--rb-u) * 0.25) rgba(0, 0, 0, 0.3);
}

.rb-eyebrows {
  position: absolute;
  width: calc(var(--rb-u) * 8);
  height: calc(var(--rb-u) * 2);
  background: var(--rb-eyebrows);
  border-radius: calc(var(--rb-u) * 2.5);
  left: calc(var(--rb-u) * 3);
  top: calc(var(--rb-u) * 4.25);
  opacity: 0.5;
}

.rb-eyebrows::after {
  content: "";
  width: calc(var(--rb-u) * 8);
  height: calc(var(--rb-u) * 2);
  background: var(--rb-eyebrows);
  border-radius: calc(var(--rb-u) * 2.5);
  position: absolute;
  left: calc(var(--rb-u) * 13);
}

.rb-eyeglasses {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.rb-glass-circle {
  width: calc(var(--rb-u) * 10);
  height: calc(var(--rb-u) * 10);
  border-radius: 50%;
  position: absolute;
  left: calc(var(--rb-u) * 1);
  top: calc(var(--rb-u) * 3);
  border: calc(var(--rb-u) * 1) solid var(--rb-jacket);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rb-glass-circle:nth-child(2) {
  left: auto;
  right: calc(var(--rb-u) * 1);
}

.rb-glass-circle::before,
.rb-glass-circle::after {
  content: "";
  border-radius: calc(var(--rb-u) * 2.5);
  width: calc(var(--rb-u) * 2);
  height: calc(var(--rb-u) * 1);
  background: var(--rb-jacket);
  position: absolute;
}

.rb-glass-circle::before {
  left: calc(var(--rb-u) * -2.5);
}

.rb-glass-circle::after {
  right: calc(var(--rb-u) * -2.5);
}

.rb-glass {
  width: calc(var(--rb-u) * 10.1);
  height: calc(var(--rb-u) * 10.1);
  background: rgba(155, 205, 205, 0.35);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.rb-glass-reflect {
  width: calc(var(--rb-u) * 2);
  height: calc(var(--rb-u) * 15);
  background: #fff;
  margin: calc(var(--rb-u) * -3) 0 0 calc(var(--rb-u) * 6);
  transform: rotate(-45deg);
  opacity: 0.3;
}

.rb-glass-reflect::before {
  content: "";
  width: calc(var(--rb-u) * 2);
  height: calc(var(--rb-u) * 15);
  background: #fff;
  position: absolute;
  margin-left: calc(var(--rb-u) * -2.5);
}

/* cap + brim (example 1) */
.rb-cap {
  width: calc(var(--rb-u) * 30);
  background: var(--rb-jacket);
  height: calc(var(--rb-u) * 28);
  border-radius: 50%;
  top: calc(var(--rb-u) * -13);
  clip-path: polygon(0 0, 100% 0, 100% calc(var(--rb-u) * 12), 0 calc(var(--rb-u) * 12));
  position: absolute;
  z-index: 1;
}

.rb-cap::after {
  content: "";
  width: calc(var(--rb-u) * 8);
  height: calc(var(--rb-u) * 8);
  position: absolute;
  border: calc(var(--rb-u) * 2) solid var(--rb-cap-reflect);
  border-right: 0;
  border-bottom: 0;
  border-radius: calc(var(--rb-u) * 18) 0 0 0;
  left: calc(var(--rb-u) * 4);
  top: calc(var(--rb-u) * 1);
  clip-path: polygon(0 0, calc(var(--rb-u) * 5) 0, calc(var(--rb-u) * 7) calc(var(--rb-u) * 8), 0 calc(var(--rb-u) * 10));
  transform: rotate(15deg);
}

.rb-cap-brim {
  width: calc(var(--rb-u) * 32);
  background: var(--rb-cap-bottom);
  height: calc(var(--rb-u) * 6);
  position: absolute;
  top: calc(var(--rb-u) * -3.25);
  border-radius: calc(var(--rb-u) * 6);
  display: flex;
  justify-content: center;
  z-index: 2;
}

/* hair when no cap */
.rb-hair-mass {
  width: calc(var(--rb-u) * 30);
  height: calc(var(--rb-u) * 16);
  background: var(--rb-hair);
  border-radius: calc(var(--rb-u) * 8) calc(var(--rb-u) * 8) 0 0;
  position: absolute;
  top: calc(var(--rb-u) * -12);
  z-index: 1;
  clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
}

.rb-ears {
  background: var(--rb-neck);
  width: calc(var(--rb-u) * 2);
  height: calc(var(--rb-u) * 4);
  position: absolute;
  left: calc(var(--rb-u) * 4);
  top: calc(var(--rb-u) * 8.5);
  border: calc(var(--rb-u) * 1) solid var(--rb-face);
  border-radius: calc(var(--rb-u) * 4) 0 0 calc(var(--rb-u) * 4);
  z-index: 1;
}

.rb-ears:nth-of-type(2) {
  left: auto;
  right: calc(var(--rb-u) * 4);
  transform: scaleX(-1);
}

.rb-ears:nth-of-type(2)::after {
  content: "";
  width: calc(var(--rb-u) * 0.75);
  height: calc(var(--rb-u) * 0.75);
  background: var(--rb-jacket);
  bottom: calc(var(--rb-u) * 4);
  left: calc(var(--rb-u) * 0.75);
  border-radius: 50%;
  position: absolute;
}

/* --- motion --- */
@keyframes rb-breathe {
  0%, 100% { transform: scale(0.88) translateY(0); }
  50% { transform: scale(0.9) translateY(calc(var(--rb-u) * -0.5)); }
}

@keyframes rb-float {
  0%, 100% { transform: scale(0.88) translateY(0); }
  50% { transform: scale(0.88) translateY(calc(var(--rb-u) * -3)); }
}

.anim-breathe .rb-man {
  animation: rb-breathe 3.2s ease-in-out infinite;
  transform-origin: bottom center;
}

.anim-float .rb-man {
  animation: rb-float 4s ease-in-out infinite;
  transform-origin: bottom center;
}
`;

  return { html, css };
}
