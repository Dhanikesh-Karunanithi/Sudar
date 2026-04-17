import { SceneSpec, CharacterPortrait, GeometricLandscape, MultiPortraitGrid, FullSceneFigure, FullFigureCharacter } from "./schema";
import { compileReferenceBust } from "./referenceBustCompiler";

export function compileMultiPortraitGrid(spec: MultiPortraitGrid): { html: string; css: string } {
  const { themeColor, backgroundColor, animation, skinTone, accentColor } = spec;

  const html = `
<div class="art-container multi-portrait-grid ${animation !== 'none' ? `anim-${animation}` : ''}">
  <div class="grid">
    <div class="portrait">
      <div class="person person_left">
        <div class="person__head">
          <div class="person__beard"></div>
          <div class="person__face"></div>
        </div>
      </div>
    </div>
    <div class="portrait">
      <div class="person person_center">
        <div class="person__head">
          <div class="person__face"></div>
        </div>
      </div>
    </div>
    <div class="portrait">
      <div class="person person_right">
        <div class="person__neck">
          <div class="person__head">
            <div class="person__face"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

  const css = `
:root {
  --theme-color: ${themeColor};
  --bg-color: ${backgroundColor};
  --accent-color: ${accentColor};
  --skin-tone: ${skinTone};
}

.multi-portrait-grid {
  width: 100vw;
  height: 100vh;
  margin: 0;
  background-color: var(--bg-color);
}

.multi-portrait-grid .person, 
.multi-portrait-grid .person::before, 
.multi-portrait-grid .person::after, 
.multi-portrait-grid .person *, 
.multi-portrait-grid .person *::after, 
.multi-portrait-grid .person *::before {
  position: absolute;
  content: '';
}

.multi-portrait-grid .grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}

.multi-portrait-grid .portrait {
  position: relative;
  overflow: hidden;

  --black: #00202a;
  --grey: #003444;
  --light-grey: #547d8f;
  --white: #f8f8f8;
  --blue: var(--accent-color);
  --dark-blue: #013344;
  --light-blue: #0ef3bd;
  --skin: var(--skin-tone);
  --dark-skin: #cc3c40;
  --light-skin: #f3af9f;
  --yellow: #f6d359;
  --dark-yellow: #e9a964;
  --red: var(--theme-color);
  --dark-red: #cc3040;
  --light-red: #eab1ae;
}
.multi-portrait-grid .portrait:nth-child(1) { background-color: #fcd2c7; }
.multi-portrait-grid .portrait:nth-child(2) { background-color: #fcf8db; }
.multi-portrait-grid .portrait:nth-child(3) { background-color: #f8e8d9; }

/* LEFT PERSON */
.person_left {
  top: 50%; left: 50%;
  width: 88px; height: 276px;
  background: linear-gradient(86deg, var(--light-skin) 90%, transparent 91%);
  translate: -42px -100px;
  --animation: 6s ease infinite;
}
.person_left::before {
  top: 147px; left: -106px;
  width: 313px; height: 129px;
  background: 
      linear-gradient(-8deg, transparent 108px, var(--dark-red) 109px, var(--dark-red) 110px, transparent 111px) 198px 0 no-repeat,
      linear-gradient(-39deg, transparent 60px, var(--dark-red) 61px, var(--dark-red) 62px, transparent 63px),
      linear-gradient(-102deg, transparent 74px, var(--dark-red) 75px, var(--dark-red) 76px, transparent 77px),
      linear-gradient(-80deg, transparent 106px, var(--dark-red) 107px, var(--dark-red) 108px, transparent 109px),
      conic-gradient(from 3rad, var(--red) 22deg, transparent 0) 25px 49px / 50px 80px no-repeat, 
      linear-gradient(-79deg, var(--red) 126px, transparent 11px),
      linear-gradient(-8deg, transparent 97px, var(--light-red) 98px, var(--light-red) 99px, transparent 100px),
      linear-gradient(108deg, transparent 149px, var(--light-red) 150px, var(--light-red) 151px, transparent 152px) 0 9px no-repeat,
      linear-gradient(-15deg, var(--white) 155px, transparent 125px),
      var(--light-skin);
  -webkit-mask-image: conic-gradient(from 126deg at 50% -21%, black 109deg, transparent 0);
}
.person_left .person__head {
  top: -62px; left: 24px;
  width: 74px; height: 74px;
  background: var(--light-skin);
  border-radius: 50%;
  transform-origin: bottom center;
  animation: leftPersonHead var(--animation);
}
@keyframes leftPersonHead {
  0%, 18%, 85%, 100% { rotate: 0deg; }
  23% { rotate: -5deg; }
  35%, 75% { rotate: 10deg; }
}
.person_left .person__head::before {
  top: 37px; left: -78px;
  width: 20px; height: 21px;
  background: var(--dark-skin);
  border-radius: 13px 0 0 0;
  transform-origin: top left;
  transform: skewX(41deg);
}
.person_left .person__head::after {
  top: 24px; left: -64px;
  width: 87px; height: 13px;
  background:
      linear-gradient(0deg, var(--light-grey) 2px, transparent 3px) 0 0 / 28px 7px no-repeat,
      linear-gradient(0deg, var(--light-grey) 2px, transparent 3px) 46px 0 / 41px 7px no-repeat,
      linear-gradient(100deg, var(--grey) 31px, transparent 3px) 5px 0 / 32px 100% no-repeat,
      linear-gradient(var(--grey) 100%, transparent 3px) 50px 0 / 32px 100% no-repeat;
  animation: leftPersonBrows var(--animation);
}
@keyframes leftPersonBrows {
  0%, 18%, 85%, 100% { translate: 0; }
  23% { translate: 0 5px; }
  26%, 75% { translate: 0 -3px; }
}
.person_left .person__beard {
  top: 64px; left: -76px;
  width: 131px; height: 153px;
  background:
      conic-gradient(from 0.2rad at 13% 41%, var(--black) 7%, transparent calc(7% + 0.2%)), 
      conic-gradient(from -1rad at 93% 36%, var(--black) 14%, transparent calc(14% + 0.2%)), 
      linear-gradient(284deg, var(--grey) 77%, transparent 0) 0 0 / 100px 100% no-repeat, 
      linear-gradient(83deg, var(--grey) 62.7%, transparent 0) 40px 0 no-repeat;
  border-radius: 0 0 15px 24px;
  transform-origin: top left;
  animation: leftPersonBeard var(--animation);
}
@keyframes leftPersonBeard {
  0%, 25%, 85%, 100% { rotate: 7deg; }
  35%, 75% { rotate: 0deg; }
}
.person_left .person__beard::before {
  top: 42px; left: 31px;
  width: 55px; height: 27px;
  background:
      linear-gradient(-16deg, transparent 18px, var(--dark-skin) 18px, var(--dark-skin) 19px, transparent 20px) 8px 0 / 38px 100% no-repeat, 
      conic-gradient(from 190deg at 60% 41%, var(--skin) 18%, transparent 0), 
      linear-gradient(107deg, var(--skin) 35%, transparent calc(35% + 1px)), 
      linear-gradient(58deg, var(--light-skin) 81%, transparent calc(81% + 1px));
  transform-origin: top left;
  border-radius: 0 0 5px 6px;
  -webkit-mask-image: conic-gradient(from 83deg at 14% 15%, black 34%, transparent 0);
  animation: leftPersonLips var(--animation);
}
@keyframes leftPersonLips {
  0%, 25%, 85%, 100% { rotate: -14deg; translate: 0; }
  35%, 75% { rotate: -18deg; translate: 0 7px; }
}
.person_left .person__beard::after {
  top: 0px; left: 0px;
  width: 100%; height: 162px;
  background: 
      linear-gradient(79deg, transparent 111px, var(--light-grey) 111px, var(--light-grey) 113px, transparent 113px) 0px 53px / 100% 71px no-repeat, 
      linear-gradient(87deg, transparent 82px, var(--light-grey) 82px, var(--light-grey) 84px, transparent 84px) 0px 88px / 100% 74px no-repeat, 
      linear-gradient(89deg, transparent 62px, var(--light-grey) 62px, var(--light-grey) 64px, transparent 64px) 0px 70px / 100% 24px no-repeat, 
      linear-gradient(95deg, transparent 48px, var(--light-grey) 48px, var(--light-grey) 50px, transparent 50px) 0px 82px / 100% 54px no-repeat, 
      linear-gradient(97deg, transparent 26px, var(--light-grey) 26px, var(--light-grey) 28px, transparent 28px) 0px 64px / 100% 96px no-repeat;
}
.person_left .person__face {
  top: 46px; left: -3px;
  width: 50px; height: 45px;
  background:
      linear-gradient(157deg, transparent 27px, var(--skin) 28px, var(--skin) 29px, transparent 30px) 0 0 / 37px 100% no-repeat,
      var(--light-skin);
  border-radius: 0 0 8px;
  transform-origin: top left;
  rotate: 23deg;
}
.person_left .person__face::before {
  top: 2px; left: -58px;
  width: 80px; height: 82px;
  background:
      linear-gradient(194deg, transparent 55px, var(--dark-skin) 56px, var(--dark-skin) 57px, transparent 58px) 0px 0px / 18px 100% no-repeat,
      linear-gradient(5deg, var(--skin) 24%, transparent calc(22% + 1px)) 0 0 / 40px 100% no-repeat,
      linear-gradient(93deg, var(--skin) 33%, transparent calc(33% + 1px)) 0px 9px no-repeat, 
      linear-gradient(104deg, var(--light-skin) 73px, transparent 74px);
  transform-origin: top left;
  border-radius: 0 0 0 9px;
  rotate: -15deg;
  transform: skewY(-23deg);
}
.person_left .person__face::after {
  top: 27px; left: -38px;
  width: 8px; height: 8px;
  background: var(--grey);
  border-radius: 50%;
  box-shadow: 46px 0 var(--grey);
  rotate: -23deg;
  animation: leftPersonEyes var(--animation);
}
@keyframes leftPersonEyes {
  0%, 20%, 26%, 100% { scale: 1; }
  23% { scale: 1 0.1; }
}

/* CENTER PERSON */
.person_center {
  top: 50%; left: 50%;
  width: 200px; height: 100px;
  background: 
      linear-gradient(var(--skin), var(--skin)) 45px 35px / 95px 2px no-repeat,
      radial-gradient(var(--light-skin) 70%, transparent 0) 0 -50px / 100% 130% no-repeat;
  border-radius: 50%;
  translate: -90px 60px;
  --animation: 6s ease infinite;
}
.person_center::before {
  top: -90px; left: 60px;
  width: 80px; height: 100px;
  background: 
      linear-gradient(140deg, var(--skin) 50%, transparent calc(50% + 1px)) no-repeat,
      var(--light-skin);
  -webkit-mask-image: linear-gradient(80deg, black 80%, transparent calc(80% + 1px));
  animation: centerPersonNeck var(--animation);
}
@keyframes centerPersonNeck {
  0%, 20%, 80%, 100% { background-position: 0 0; }
  30% { background-position: 0 7px; }
  40%, 70% { background-position: 0 -5px; }
}
.person_center .person__head {
  top: -145px; left: 5px;
  width: 50px; height: 50px;
  background: var(--dark-skin);
  border-radius: 50%;
  box-shadow:
      135px 0 var(--light-skin),
      120px -40px 0 10px var(--yellow),
      80px -60px var(--yellow),
      30px -100px 0 15px var(--yellow),
      25px -50px 0 10px var(--dark-yellow),
      80px -70px 0 10px var(--dark-yellow);
  animation: centerPersonHead var(--animation), centerPersonHair var(--animation);
}
@keyframes centerPersonHead {
  0%, 20%, 80%, 100% { translate: 0 0; }
  30% { translate: -2px 10px; }
  40%, 70% { translate: -2px -7px; }
}
@keyframes centerPersonHair {
  0%, 30%, 80%, 100% {
    box-shadow:
      135px 0 var(--light-skin),
      120px -40px 0 10px var(--yellow),
      80px -60px var(--yellow),
      30px -100px 0 15px var(--yellow),
      25px -50px 0 10px var(--dark-yellow),
      80px -70px 0 10px var(--dark-yellow);
  }
  40%, 70% {
    box-shadow:
      130px 0 var(--light-skin),
      120px -30px 0 10px var(--yellow),
      85px -55px var(--yellow),
      33px -100px 0 15px var(--yellow),
      20px -45px 0 10px var(--dark-yellow),
      75px -55px 0 10px var(--dark-yellow);
  }
}
.person_center .person__head::before {
  top: -30px; left: 25px;
  width: 130px; aspect-ratio: 1/1;
  background: 
      linear-gradient(-150deg, var(--yellow) 29%, transparent 0) no-repeat,
      linear-gradient(100deg, var(--skin) 45%, transparent calc(45% + 1px)) 0 70px no-repeat,
      linear-gradient(100deg, var(--skin) 45%, transparent calc(45% + 1px)) no-repeat,
      var(--light-skin);
  border-radius: 50%;
  animation: centerPersonFace var(--animation), centerPersonNose var(--animation);
}
@keyframes centerPersonFace {
  0%, 30%, 80%, 100% { translate: 0 0; }
  40%, 70% { translate: 4px 0; }
}
@keyframes centerPersonNose {
  0%, 20%, 80%, 100% { background-position: 0 0, -13px 70px, -13px 0, 0 0; }
  30% { background-position: 0 0, -13px 75px, -13px 5px, 0 0; }
  40%, 70% { background-position: 0 0, -5px 70px, -5px 0, 0 0; }
}
.person_center .person__head::after {
  top: 45px; left: 40px;
  width: 60px; height: 23px;
  border-radius: 0 0 50% 50%;
  box-shadow: inset 0 -13px 0 -10px var(--dark-skin);
  animation: centerPersonSmile var(--animation)
}
@keyframes centerPersonSmile {
  0%, 20%, 80%, 100% { transform: translate(0, 0) scale(1) rotate(0); }
  30% { transform: translate(0px, 5px) scale(1) rotate(0deg); }
  40%, 70% { transform: translate(15px, -5px) scale(0.8) rotate(-15deg); }
}
.person_center .person__face {
  top: 15px; left: 35px;
  width: 8px; aspect-ratio: 1/1;
  background: var(--black);
  border-radius: 50%;
  box-shadow: 65px 0 var(--black);
  animation: centerPersonEyes var(--animation);
}
@keyframes centerPersonEyes {
  0%, 20%, 80%, 100% { translate: 0 0; }
  30% { translate: 2px 5px; }
  40%, 70% { translate: 15px -10px; }
}
.person_center .person__face::before {
  top: -85px; left: -20px;
  width: 330px; height: 120px;
  border-radius: 0 0 0 100%;
  box-shadow: inset 120px 0 0 -50px var(--yellow);
  animation: centerPersonForelock var(--animation);
}
@keyframes centerPersonForelock {
  0%, 20%, 80%, 100% { translate: 0 0; }
  30% { translate: 0 -5px; }
  40%, 70% { translate: -12px -2px; }
}
.person_center .person__face::after {
  top: -25px; left: -28px;
  width: 60px; aspect-ratio: 1/1;
  border: 2px solid var(--blue);
  border-radius: 50%;
  filter: drop-shadow(75px 0 var(--blue));
  animation: centerPersonGlasses var(--animation);
}
@keyframes centerPersonGlasses {
  0%, 30%, 80%, 100% { translate: 0 0; }
  40%, 70% { translate: -5px 5px; }
}

/* RIGHT PERSON */
.person_right {
  top: 50%; left: 50%;
  width: 224px; height: 69px;
  background:
      linear-gradient(125deg, transparent 120px, var(--light-blue) 121px, var(--light-blue) 122px, transparent 123px) 0 21px no-repeat,
      conic-gradient(from 141deg at 75% 0%, var(--blue) 107deg, transparent 0);
  translate: -85px 60px;
  --animation-slow: 6s ease infinite;
  --animation-fast: 1.5s ease infinite;
}
.person_right::before {
  top: 68px; left: -1px;
  width: 198px; height: 51px;
  background: linear-gradient(196deg, var(--white) 54%, transparent 0);
  border-radius: 0 20px 31px 0;
  transform-origin: top left;
  rotate: -38deg;
  z-index: 1;
}
.person_right::after {
  top: 42px; left: 46px;
  width: 154px; height: 2px;
  background: var(--light-red);
  transform-origin: top left;
  rotate: -28deg;
  z-index: 1;
}
.person_right .person__neck {
  top: -94px; right: 126px;
  width: 104px; height: 87px;
  background:
      linear-gradient(120deg, transparent calc(55% - 1px), var(--dark-skin) 55%, var(--dark-skin) calc(55% + 1px), transparent calc(55% + 2px)) 0 9px / 100% 63px no-repeat,
      conic-gradient(from 20deg at 13% 58%, var(--dark-skin) 8%, var(--skin) 8% 50%, transparent 0);
  transform-origin: top right;
  rotate: -30deg;
  animation: rightPersonNeck var(--animation-fast);
}
@keyframes rightPersonNeck {
  0%, 100% { background-position: 0 9px, 0 0; }
  50% { background-position: 0 9px, 0 8px; }
}
.person_right .person__neck::before {
  top: -177px; left: 38px;
  width: 110px; height: 110px;
  background: var(--dark-blue);
  border-radius: 50%;
  box-shadow: inset 5px 40px 0 -10px var(--blue);
  animation: rightPersonHair var(--animation-fast);
  animation-delay: 0.08s;
}
@keyframes rightPersonHair {
  0%, 100% { translate: 0 0; }
  50% { translate: -15px 8px; }
}
.person_right .person__neck::after {
  top: -39px; left: 89px;
  width: 48px; height: 48px;
  background:
      conic-gradient(from 180deg, var(--skin) 90deg, transparent 0),
      radial-gradient(transparent 8px, var(--dark-skin) 9px, var(--dark-skin) 10px, transparent 11px),
      linear-gradient(90deg, var(--skin) 59%, var(--light-skin) calc(59% + 1px));
  border-radius: 50%;
  rotate: 30deg;
}
.person_right .person__head {
  top: -114px; left: -17px;
  width: 150px; height: 106px;
  background: radial-gradient(circle, var(--skin) 70%, transparent 0) -11px 59px / 160px 160px no-repeat, var(--light-skin);
  border-radius: 60% 40% 20% 20% / 70% 70% 20% 20%;
  transform-origin: bottom right;
  animation: rightPersonHead var(--animation-fast);
}
@keyframes rightPersonHead {
  0%, 100% { rotate: -15deg; translate: -3px 3px; }
  50% { rotate: -20deg; translate: 0 0; }
}
.person_right .person__head::before {
  top: 42px; left: 82px;
  width: 76px; height: 71px;
  background:
      linear-gradient(93deg, transparent 63px, var(--blue) 64px, var(--blue) 65px, transparent 66px) 0 0 / 100% 57px no-repeat,
      conic-gradient(from 59deg at 2% 60%, var(--dark-blue) 63deg, transparent 64deg);
  border-radius: 0 0 17px 0;
  transform-origin: top left;
  rotate: -15deg;
}
.person_right .person__head::after {
  top: 27px; left: 13px;
  width: 30px; height: 13px;
  border-radius: 0 0 60% 0 / 0 0 100% 0;
  border-color: var(--grey);
  border-width: 0 2px 2px 0;
  border-style: solid;
  transform-origin: top left;
  rotate: 45deg;
  animation: rightPersonSmile var(--animation-slow);
}
@keyframes rightPersonSmile {
  0%, 50%, 100% { border-radius: 0 0 60% 0 / 0 0 100% 0; scale: 1; translate: 0 0; rotate: 45deg; }
  55%, 95% { border-radius: 0 0 100% 0 / 0 0 100% 0; scale: 0.8; translate: -1px 8px; rotate: 35deg; }
}
.person_right .person__face {
  top: 26px; left: 63px;
  width: 51px; height: 5px;
  background: var(--dark-blue);
  rotate: 45deg;
}
.person_right .person__face::before {
  top: 11px; left: 0px;
  width: 25px; height: 12px;
  background: linear-gradient(90deg, var(--black) 50%, var(--white) 50%) 50% 0 / 200% 100%;
  border-radius: 0 0 99em 99em;
  animation: rightPersonEye var(--animation-slow);
}
@keyframes rightPersonEye {
  0%, 50%, 100% { background-position: 50% 0; border-radius: 0 0 99em 99em; scale: 1; }
  52%, 98% { background-position: 0 0; border-radius: 0; scale: 1 0.2; }
}
.person_right .person__face::after {
  top: 16px; left: -34px;
  width: 24px; height: 36px;
  background: conic-gradient(from 170deg at 73% 0%, var(--dark-skin) 38deg, transparent 0);
  border-radius: 0 0 0 4px;
}
`;

  return { html, css };
}
export function compileFullSceneFigure(spec: FullSceneFigure): { html: string; css: string } {
  const { themeColor, backgroundColor, animation, skinTone, suitColor } = spec;

  const html = `
<div class="art-container full-scene-figure ${animation !== 'none' ? `anim-${animation}` : ''}">
  <div class="background">
    <div class="moon"></div>
    <div class="stars"></div>
  </div>
  <div class="figure">
    <div class="head">
      <div class="face"></div>
      <div class="hair"></div>
    </div>
    <div class="body">
      <div class="torso"></div>
      <div class="arm left"></div>
      <div class="arm right"></div>
      <div class="leg left"></div>
      <div class="leg right"></div>
    </div>
  </div>
  <div class="foreground">
    <div class="ground"></div>
  </div>
</div>
`;

  const css = `
:root {
  --theme-color: ${themeColor};
  --bg-color: ${backgroundColor};
  --skin-tone: ${skinTone};
  --suit-color: ${suitColor};
  --highlight: color-mix(in srgb, var(--suit-color) 40%, white);
  --shadow: color-mix(in srgb, var(--suit-color) 60%, black);
}

.full-scene-figure {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, var(--bg-color), #000);
}

.background {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1;
}

.moon {
  position: absolute;
  top: 10%; right: 15%;
  width: 150px; height: 150px;
  background: #f4f6f0;
  border-radius: 50%;
  box-shadow: 0 0 50px rgba(244, 246, 240, 0.5), inset -20px -20px 40px rgba(0,0,0,0.2);
}

.stars {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 60%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: 0.6;
}

.foreground {
  position: absolute;
  bottom: 0; left: 0; width: 100%; height: 30%;
  z-index: 3;
}

.ground {
  position: absolute;
  bottom: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to top, #111, transparent);
}
.ground::before {
  content: '';
  position: absolute;
  bottom: 0; left: -10%; width: 120%; height: 150%;
  background: #1a1a1a;
  border-radius: 50% 50% 0 0;
  box-shadow: inset 0 20px 50px rgba(0,0,0,0.8);
}

.figure {
  position: absolute;
  bottom: 15%; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 400px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.head {
  position: relative;
  width: 60px; height: 80px;
  margin-bottom: 10px;
}

.face {
  position: absolute;
  bottom: 0; left: 50%; transform: translateX(-50%);
  width: 50px; height: 60px;
  background: var(--skin-tone);
  border-radius: 25px 25px 30px 30px;
  box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2);
}

.hair {
  position: absolute;
  top: 0; left: 50%; transform: translateX(-50%);
  width: 70px; height: 40px;
  background: var(--theme-color);
  border-radius: 35px 35px 0 0;
  box-shadow: inset -5px 5px 10px rgba(255,255,255,0.2);
}

.body {
  position: relative;
  width: 100px; height: 300px;
}

.torso {
  position: absolute;
  top: 0; left: 50%; transform: translateX(-50%);
  width: 80px; height: 140px;
  background: var(--suit-color);
  border-radius: 40px 40px 20px 20px;
  box-shadow: inset -10px 0 20px var(--shadow), inset 10px 0 20px var(--highlight);
}

.torso::after {
  content: '';
  position: absolute;
  top: 20px; left: 50%; transform: translateX(-50%);
  width: 40px; height: 60px;
  background: var(--theme-color);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  opacity: 0.8;
}

.arm {
  position: absolute;
  top: 10px;
  width: 30px; height: 120px;
  background: var(--suit-color);
  border-radius: 15px;
}

.arm.left {
  left: -15px;
  transform-origin: top center;
  transform: rotate(15deg);
  box-shadow: inset 5px 0 10px var(--highlight);
}

.arm.right {
  right: -15px;
  transform-origin: top center;
  transform: rotate(-15deg);
  box-shadow: inset -5px 0 10px var(--shadow);
}

.leg {
  position: absolute;
  top: 130px;
  width: 35px; height: 160px;
  background: var(--suit-color);
  border-radius: 17px;
}

.leg.left {
  left: 10px;
  box-shadow: inset 5px 0 10px var(--highlight);
}

.leg.right {
  right: 10px;
  box-shadow: inset -5px 0 10px var(--shadow);
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-20px); }
}
.anim-float .figure { animation: float 6s ease-in-out infinite; }

@keyframes breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.02); }
}
.anim-breathe .torso { animation: breathe 4s ease-in-out infinite; transform-origin: bottom center; }

@keyframes pulse {
  0%, 100% { filter: drop-shadow(0 0 10px var(--theme-color)); }
  50% { filter: drop-shadow(0 0 30px var(--theme-color)); }
}
.anim-pulse .torso::after { animation: pulse 3s ease-in-out infinite; }
`;

  return { html, css };
}

export function compileScene(spec: SceneSpec): { html: string; css: string } {
  if (spec.archetype === "character-portrait") {
    return compileCharacterPortrait(spec);
  } else if (spec.archetype === "reference-bust") {
    return compileReferenceBust(spec);
  } else if (spec.archetype === "geometric-landscape") {
    return compileGeometricLandscape(spec);
  } else if (spec.archetype === "multi-portrait-grid") {
    return compileMultiPortraitGrid(spec);
  } else if (spec.archetype === "full-scene-figure") {
    return compileFullSceneFigure(spec);
  } else if (spec.archetype === "full-figure-character") {
    return compileFullFigureCharacter(spec);
  }
  return { html: "", css: "" };
}

function compileCharacterPortrait(spec: CharacterPortrait): { html: string; css: string } {
  const { 
    themeColor, backgroundColor, animation, 
    faceShape, skinTone, eyeStyle, noseStyle, mouthStyle, 
    hairStyle, hairColor, facialHair, accessory, headwear, details 
  } = spec;

  const html = `
<div class="art-container ${animation !== 'none' ? `anim-${animation}` : ''}">
  <div class="character">
    ${hairStyle === 'long' || hairStyle === 'pigtails' ? `<div class="hair-back hair-${hairStyle}"></div>` : ''}
    <div class="shirt">
      <div class="collar"></div>
    </div>
    <div class="neck">
      <div class="neck-shadow"></div>
    </div>
    <div class="head shape-${faceShape}">
      <div class="ears"></div>
      <div class="face">
        ${details === 'freckles' ? `<div class="freckles"></div>` : ''}
        ${details === 'tattoo' ? `<div class="tattoo"></div>` : ''}
        <div class="cheeks"></div>
        <div class="eyes style-${eyeStyle}">
          <div class="eye left"></div>
          <div class="eye right"></div>
        </div>
        <div class="nose style-${noseStyle}"></div>
        ${facialHair === 'mustache' || facialHair === 'full-beard' ? `<div class="facial-hair mustache"></div>` : ''}
        <div class="mouth style-${mouthStyle}"></div>
        ${facialHair === 'beard' || facialHair === 'goatee' || facialHair === 'full-beard' ? `<div class="facial-hair ${facialHair}"></div>` : ''}
        ${accessory === 'glasses' || accessory === 'sunglasses' ? `
        <div class="accessory accessory-${accessory}">
          <div class="glass-left"></div>
          <div class="glass-bridge"></div>
          <div class="glass-right"></div>
        </div>` : ''}
        ${accessory === 'headband' ? `<div class="accessory accessory-headband"></div>` : ''}
      </div>
      ${hairStyle !== 'long' && hairStyle !== 'pigtails' ? `<div class="hair hair-${hairStyle}"></div>` : ''}
      ${hairStyle === 'long' || hairStyle === 'pigtails' ? `<div class="hair-front hair-${hairStyle}"></div>` : ''}
      ${accessory === 'earrings' ? `
      <div class="accessory accessory-earrings">
        <div class="earring left"></div>
        <div class="earring right"></div>
      </div>` : ''}
      ${headwear !== 'none' ? `<div class="headwear headwear-${headwear}"></div>` : ''}
    </div>
    ${
      accessory === "laptop" ||
      accessory === "coffee" ||
      accessory === "book" ||
      accessory === "phone" ||
      accessory === "yoga-mat"
        ? `<div class="portrait-held-prop prop-${accessory}" aria-hidden="true"></div>`
        : ""
    }
  </div>
</div>
`;

  const css = `
:root {
  --theme-color: ${themeColor};
  --bg-color: ${backgroundColor};
  --hair-color: ${hairColor};
  --skin-tone: ${skinTone};
  --skin-shadow: color-mix(in srgb, var(--skin-tone) 80%, black);
  --skin-highlight: color-mix(in srgb, var(--skin-tone) 80%, white);
  --shirt-color: var(--theme-color);
  --shirt-dark: color-mix(in srgb, var(--theme-color) 80%, black);
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%);
  overflow: hidden;
}

.art-container {
  position: relative;
  width: 400px;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.character {
  position: relative;
  width: 200px;
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

/* Shirt & Shoulders */
.shirt {
  width: 160px;
  height: 60px;
  background: var(--shirt-color);
  border-radius: 40px 40px 10px 10px;
  position: absolute;
  bottom: 0;
  z-index: 2;
  overflow: hidden;
  box-shadow: inset 0 -10px 20px rgba(0,0,0,0.1);
}
.collar {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: var(--shirt-dark);
  border-radius: 0 0 30px 30px;
}

/* Neck */
.neck {
  width: 44px;
  height: 50px;
  background: var(--skin-tone);
  position: absolute;
  bottom: 40px;
  z-index: 1;
  border-radius: 0 0 20px 20px;
}
.neck-shadow {
  width: 100%;
  height: 20px;
  background: var(--skin-shadow);
  border-radius: 0 0 20px 20px;
  position: absolute;
  top: 0;
}

/* Head & Face */
.head {
  width: 120px;
  height: 140px;
  position: absolute;
  bottom: 75px;
  z-index: 3;
}

/* Face Shapes */
.head.shape-round .face { border-radius: 45px 45px 50px 50px; }
.head.shape-square .face { border-radius: 20px 20px 30px 30px; }
.head.shape-oval { height: 160px; bottom: 65px; }
.head.shape-oval .face { border-radius: 60px 60px 80px 80px; }
.head.shape-wide { width: 140px; left: -10px; }
.head.shape-wide .face { border-radius: 40px; }

.ears {
  width: calc(100% + 20px);
  height: 36px;
  position: absolute;
  top: 65px;
  left: -10px;
  display: flex;
  justify-content: space-between;
  z-index: 1;
}
.ears::before, .ears::after {
  content: '';
  width: 20px;
  height: 36px;
  background: var(--skin-shadow);
  border-radius: 10px;
}

.face {
  width: 100%;
  height: 100%;
  background: var(--skin-tone);
  position: relative;
  z-index: 2;
  box-shadow: inset -8px -8px 16px rgba(0,0,0,0.05);
  overflow: hidden;
}

/* Details */
.freckles {
  position: absolute;
  top: 85px;
  width: 100%;
  height: 10px;
  background-image: 
    radial-gradient(2px 2px at 30px 5px, var(--skin-shadow), transparent),
    radial-gradient(2px 2px at 40px 2px, var(--skin-shadow), transparent),
    radial-gradient(2px 2px at 35px 8px, var(--skin-shadow), transparent),
    radial-gradient(2px 2px at 80px 5px, var(--skin-shadow), transparent),
    radial-gradient(2px 2px at 90px 2px, var(--skin-shadow), transparent),
    radial-gradient(2px 2px at 85px 8px, var(--skin-shadow), transparent);
  opacity: 0.6;
}
.tattoo {
  position: absolute;
  top: 30px;
  right: 15px;
  width: 20px;
  height: 20px;
  border: 3px solid #222;
  border-radius: 50%;
  box-sizing: border-box;
  opacity: 0.8;
}
.tattoo::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 6px; height: 6px;
  background: #222;
  border-radius: 50%;
}

/* Facial Features */
.cheeks {
  position: absolute;
  top: 85px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 15px;
  box-sizing: border-box;
}
.cheeks::before, .cheeks::after {
  content: '';
  width: 20px;
  height: 12px;
  background: rgba(255, 100, 100, 0.3);
  border-radius: 50%;
}

.eyes {
  position: absolute;
  top: 65px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 32px;
}
.eye {
  width: 14px;
  height: 14px;
  background: #222;
  border-radius: 50%;
  position: relative;
}
.eyes.style-dots .eye::after { display: none; }
.eyes.style-wide .eye { width: 20px; height: 20px; }
.eyes.style-wide .eye::after { width: 8px; height: 8px; top: 3px; right: 4px; }
.eyes.style-half-closed .eye { border-radius: 50% 50% 0 0; height: 8px; }
.eyes.style-half-closed .eye::after { display: none; }

.eye::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 3px;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
}

.nose {
  position: absolute;
  top: 75px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--skin-shadow);
}
.nose.style-small { width: 12px; height: 16px; border-radius: 6px; }
.nose.style-wide { width: 24px; height: 18px; border-radius: 10px; }
.nose.style-long { width: 14px; height: 35px; border-radius: 7px; top: 65px; }
.nose.style-button { width: 20px; height: 12px; border-radius: 10px; top: 80px; }

.mouth {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.mouth.style-smile-teeth {
  top: 110px;
  width: 32px;
  height: 16px;
  background: #fff;
  border-radius: 0 0 16px 16px;
  border: 3px solid #222;
  border-top: 0;
  box-sizing: border-box;
}
.mouth.style-smile-closed {
  top: 115px;
  width: 24px;
  height: 10px;
  border-bottom: 3px solid #222;
  border-radius: 0 0 12px 12px;
}
.mouth.style-smirk {
  top: 115px;
  width: 20px;
  height: 8px;
  border-bottom: 3px solid #222;
  border-left: 3px solid #222;
  border-radius: 0 0 0 10px;
  transform: translateX(-30%) rotate(-10deg);
}
.mouth.style-open-tongue {
  top: 105px;
  width: 24px;
  height: 28px;
  background: #500;
  border-radius: 12px 12px 20px 20px;
  overflow: hidden;
}
.mouth.style-open-tongue::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 8px 8px 0 0;
}
.mouth.style-lips {
  top: 115px;
  width: 24px;
  height: 10px;
  background: #d45;
  border-radius: 12px;
}

/* Facial Hair */
.facial-hair {
  position: absolute;
  background: var(--hair-color);
  z-index: 2;
}
.mustache {
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 16px;
  border-radius: 8px;
}
.beard {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 60px;
  border-radius: 0 0 60px 60px;
}
.goatee {
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 20px;
  border-radius: 0 0 15px 15px;
}
.full-beard {
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 90px;
  border-radius: 0 0 70px 70px;
}

/* Hair Styles */
.hair {
  position: absolute;
  z-index: 3;
  background: var(--hair-color);
}

.hair-short {
  top: -15px;
  left: -10px;
  width: 140px;
  height: 60px;
  border-radius: 40px 40px 10px 10px;
}
.hair-short::after {
  content: '';
  position: absolute;
  top: 30px;
  right: -5px;
  width: 20px;
  height: 40px;
  background: var(--hair-color);
  border-radius: 10px;
}

.hair-back.hair-long {
  position: absolute;
  top: 30px;
  left: 20px;
  width: 160px;
  height: 200px;
  background: var(--hair-color);
  border-radius: 60px 60px 20px 20px;
  z-index: 0;
}
.hair-front.hair-long {
  position: absolute;
  top: -10px;
  left: -5px;
  width: 130px;
  height: 40px;
  background: var(--hair-color);
  border-radius: 30px 30px 0 0;
  z-index: 3;
}

.hair-curly {
  top: -25px;
  left: -25px;
  width: 170px;
  height: 90px;
  border-radius: 50px;
  background: var(--hair-color);
}
.hair-curly::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 20px;
  width: 60px;
  height: 60px;
  background: var(--hair-color);
  border-radius: 50%;
}
.hair-curly::after {
  content: '';
  position: absolute;
  top: -20px;
  right: 20px;
  width: 70px;
  height: 70px;
  background: var(--hair-color);
  border-radius: 50%;
}

.hair-spiky {
  top: -35px;
  left: 0;
  width: 120px;
  height: 40px;
  background: transparent;
}
.hair-spiky::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -10px;
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 60px solid var(--hair-color);
  transform: rotate(-25deg);
}
.hair-spiky::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -10px;
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 60px solid var(--hair-color);
  transform: rotate(25deg);
}

.hair-afro {
  top: -40px;
  left: -30px;
  width: 180px;
  height: 140px;
  background: var(--hair-color);
  border-radius: 50%;
  box-shadow: 
    -20px 20px 0 var(--hair-color),
    20px 20px 0 var(--hair-color),
    -10px -10px 0 10px var(--hair-color),
    10px -10px 0 10px var(--hair-color);
}

.hair-pigtails.hair-back {
  top: 20px;
  left: -40px;
  width: 200px;
  height: 80px;
  background: transparent;
}
.hair-pigtails.hair-back::before, .hair-pigtails.hair-back::after {
  content: '';
  position: absolute;
  width: 70px;
  height: 70px;
  background: var(--hair-color);
  border-radius: 50%;
}
.hair-pigtails.hair-back::before { left: 0; }
.hair-pigtails.hair-back::after { right: 0; }

.hair-pigtails.hair-front {
  top: -10px;
  left: -10px;
  width: 140px;
  height: 40px;
  background: var(--hair-color);
  border-radius: 30px 30px 0 0;
}

.hair-asymmetrical {
  top: -20px;
  left: -20px;
  width: 160px;
  height: 120px;
  background: var(--hair-color);
  border-radius: 80px 80px 0 80px;
}

.hair-bald {
  display: none;
}

/* Accessories */
.accessory-glasses, .accessory-sunglasses {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 4;
}
.glass-left, .glass-right {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(255,255,255,0.2);
}
.accessory-sunglasses .glass-left, .accessory-sunglasses .glass-right {
  background: #222;
  border-color: #111;
}
.accessory-sunglasses .glass-left::after, .accessory-sunglasses .glass-right::after {
  content: '';
  position: absolute;
  top: 5px; left: 5px;
  width: 10px; height: 10px;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
}
.glass-bridge {
  width: 20px;
  height: 4px;
  background: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.accessory-earrings {
  position: absolute;
  top: 85px;
  width: 140px;
  left: -10px;
  display: flex;
  justify-content: space-between;
  z-index: 4;
}
.earring {
  width: 8px;
  height: 24px;
  background: #FFD700;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.accessory-headband {
  position: absolute;
  top: 15px;
  left: -5px;
  width: 130px;
  height: 16px;
  background: var(--theme-color);
  border-radius: 8px;
  z-index: 4;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Headwear */
.headwear {
  position: absolute;
  z-index: 5;
}
.headwear-cap {
  top: -30px;
  left: -10px;
  width: 140px;
  height: 60px;
  background: var(--theme-color);
  border-radius: 60px 60px 0 0;
}
.headwear-cap::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -20px;
  width: 60px;
  height: 15px;
  background: var(--theme-color);
  border-radius: 0 15px 15px 0;
}
.headwear-beret {
  top: -20px;
  left: -20px;
  width: 160px;
  height: 40px;
  background: var(--theme-color);
  border-radius: 50%;
  transform: rotate(-10deg);
}
.headwear-beret::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  width: 10px;
  height: 10px;
  background: var(--theme-color);
  border-radius: 50%;
}
.headwear-bowler {
  top: -50px;
  left: 10px;
  width: 100px;
  height: 60px;
  background: #222;
  border-radius: 50px 50px 0 0;
}
.headwear-bowler::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -20px;
  width: 140px;
  height: 10px;
  background: #222;
  border-radius: 5px;
}

/* Held props (portrait bust — shown beside torso) */
.portrait-held-prop {
  position: absolute;
  left: 8px;
  bottom: 64px;
  z-index: 6;
  pointer-events: none;
}
.portrait-held-prop.prop-laptop {
  width: 34px;
  height: 24px;
  background: linear-gradient(180deg, #d8d8d8 45%, #9a9a9a 45%);
  border-radius: 3px;
  transform: rotate(-14deg);
  box-shadow: inset 0 0 0 2px #666;
}
.portrait-held-prop.prop-coffee {
  width: 14px;
  height: 22px;
  background: #f5f5f5;
  border-radius: 2px 2px 5px 5px;
  transform: rotate(6deg);
}
.portrait-held-prop.prop-coffee::after {
  content: '';
  position: absolute;
  top: -3px;
  left: -2px;
  width: 18px;
  height: 5px;
  background: #333;
  border-radius: 2px;
}
.portrait-held-prop.prop-book {
  width: 22px;
  height: 30px;
  background: var(--theme-color);
  border-radius: 2px 5px 5px 2px;
  transform: rotate(12deg);
  box-shadow: inset -2px 0 0 rgba(0,0,0,0.15);
}
.portrait-held-prop.prop-phone {
  width: 10px;
  height: 18px;
  background: #2a2a2a;
  border-radius: 2px;
  transform: rotate(-8deg);
}
.portrait-held-prop.prop-phone::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 2px;
  background: #444;
  border-radius: 1px;
}
.portrait-held-prop.prop-yoga-mat {
  width: 16px;
  height: 56px;
  background: color-mix(in srgb, var(--theme-color) 85%, white);
  border-radius: 8px;
  transform: rotate(35deg);
  bottom: 48px;
  left: 2px;
  opacity: 0.95;
}

/* Animations */
@keyframes breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.03) translateY(-2px); }
}
.anim-breathe .character { animation: breathe 3s ease-in-out infinite; transform-origin: bottom center; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
.anim-float .character { animation: float 4s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { filter: drop-shadow(0 0 10px var(--theme-color)); }
  50% { filter: drop-shadow(0 0 25px var(--theme-color)); }
}
.anim-pulse .character { animation: pulse 3s ease-in-out infinite; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.anim-spin .character { animation: spin 8s linear infinite; }
`;

  return { html, css };
}

function fullFigureAccessoryOnLeft(
  pose: FullFigureCharacter["pose"],
  accessory: FullFigureCharacter["accessory"]
): boolean {
  if (accessory === "none") return false;
  if (pose === "waving") return true;
  if (pose === "walking" && accessory === "yoga-mat") return true;
  return false;
}

function compileFullFigureCharacter(spec: FullFigureCharacter): { html: string; css: string } {
  const {
    themeColor,
    backgroundColor,
    animation,
    pose,
    direction,
    skinTone,
    hairStyle,
    hairColor,
    topStyle,
    topColor,
    bottomStyle,
    bottomColor,
    shoesColor,
    accessory,
  } = spec;
  const figureTheme = spec.figureTheme ?? "rounded";
  const accLeft = fullFigureAccessoryOnLeft(pose, accessory);
  const accHtml =
    accessory !== "none" ? `<div class="accessory acc-${accessory}" aria-hidden="true"></div>` : "";

  const html = `
<div class="art-container ff-${figureTheme} ${animation !== "none" ? `anim-${animation}` : ""}">
  <div class="full-figure pose-${pose} dir-${direction}">
    <div class="figure-inner">
      <div class="figure-motion">
        <div class="head">
          <div class="hair-back hair-${hairStyle}"></div>
          <div class="neck"></div>
          <div class="face">
            <div class="ear"></div>
            <div class="eye"></div>
            <div class="nose"></div>
            <div class="mouth"></div>
          </div>
          <div class="hair-front hair-${hairStyle}"></div>
        </div>
        <div class="body-column">
          <div class="torso top-${topStyle}">
            <div class="chest"></div>
            <div class="arm right-arm">
              <div class="upper-arm"></div>
              <div class="lower-arm">
                <div class="hand">${!accLeft ? accHtml : ""}</div>
              </div>
            </div>
            <div class="arm left-arm">
              <div class="upper-arm"></div>
              <div class="lower-arm">
                <div class="hand">${accLeft ? accHtml : ""}</div>
              </div>
            </div>
          </div>
          <div class="legs bottom-${bottomStyle}">
            <div class="pelvis"></div>
            <div class="leg right-leg">
              <div class="thigh"></div>
              <div class="calf">
                <div class="shoe"></div>
              </div>
            </div>
            <div class="leg left-leg">
              <div class="thigh"></div>
              <div class="calf">
                <div class="shoe"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

  const css = `
:root {
  --theme-color: ${themeColor};
  --bg-color: ${backgroundColor};
  --skin-tone: ${skinTone};
  --skin-shadow: color-mix(in srgb, var(--skin-tone) 80%, black);
  --hair-color: ${hairColor};
  --top-color: ${topColor};
  --top-shadow: color-mix(in srgb, var(--top-color) 80%, black);
  --bottom-color: ${bottomColor};
  --bottom-shadow: color-mix(in srgb, var(--bottom-color) 80%, black);
  --shoes-color: ${shoesColor};
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  overflow: hidden;
}

.art-container {
  position: relative;
  width: 400px;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.full-figure {
  position: relative;
  width: 200px;
  height: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.figure-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.figure-motion {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  transform-origin: 50% 92%;
}

.body-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -18px;
  width: 100%;
}

.full-figure.dir-side-left {
  transform: scaleX(-1);
}

/* --- HEAD & FACE --- */
.head {
  position: relative;
  width: 60px;
  height: 80px;
  z-index: 4;
}
.neck {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 30px;
  background: var(--skin-shadow);
  border-radius: 0 0 10px 10px;
  z-index: 1;
}
.face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--skin-tone);
  border-radius: 30px 30px 40px 40px;
  z-index: 2;
}
.ear {
  position: absolute;
  top: 35px;
  right: -5px;
  width: 12px;
  height: 16px;
  background: var(--skin-shadow);
  border-radius: 6px;
}
.eye {
  position: absolute;
  top: 30px;
  left: 15px;
  width: 6px;
  height: 6px;
  background: #222;
  border-radius: 50%;
}
.nose {
  position: absolute;
  top: 40px;
  left: 5px;
  width: 8px;
  height: 12px;
  background: var(--skin-shadow);
  border-radius: 4px;
}
.mouth {
  position: absolute;
  bottom: 20px;
  left: 15px;
  width: 12px;
  height: 4px;
  background: #222;
  border-radius: 0 0 4px 4px;
}

/* Hair */
.hair-front, .hair-back {
  position: absolute;
  background: var(--hair-color);
}
.hair-front { z-index: 3; }
.hair-back { z-index: 0; }

.hair-short.hair-front {
  top: -5px; left: -5px;
  width: 70px; height: 30px;
  border-radius: 35px 35px 0 0;
}
.hair-long.hair-front {
  top: -5px; left: -5px;
  width: 70px; height: 30px;
  border-radius: 35px 35px 0 0;
}
.hair-long.hair-back {
  top: 10px; left: 20px;
  width: 50px; height: 100px;
  border-radius: 25px;
}
.hair-bun.hair-front {
  top: -5px; left: -5px;
  width: 70px; height: 30px;
  border-radius: 35px 35px 0 0;
}
.hair-bun.hair-back {
  top: -15px; right: 0px;
  width: 40px; height: 40px;
  border-radius: 50%;
}
.hair-ponytail.hair-front {
  top: -5px; left: -5px;
  width: 70px; height: 30px;
  border-radius: 35px 35px 0 0;
}
.hair-ponytail.hair-back {
  top: 10px; right: -20px;
  width: 40px; height: 80px;
  border-radius: 0 40px 40px 0;
}
.hair-bob.hair-front {
  top: -5px; left: -5px;
  width: 70px; height: 60px;
  border-radius: 35px 35px 10px 10px;
}

/* --- TORSO & ARMS --- */
.torso {
  position: relative;
  width: 80px;
  height: 140px;
  margin-top: 0;
  z-index: 3;
}
.chest {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: var(--top-color);
  border-radius: 30px 30px 10px 10px;
  z-index: 2;
}

.arm {
  position: absolute;
  top: 10px;
  width: 24px;
}
.left-arm { left: -10px; z-index: 1; }
.right-arm { right: -10px; z-index: 4; }

.upper-arm {
  width: 24px;
  height: 70px;
  background: var(--skin-tone);
  border-radius: 12px;
  transform-origin: top center;
}
.lower-arm {
  position: absolute;
  top: 60px; left: 0;
  width: 20px;
  height: 70px;
  background: var(--skin-tone);
  border-radius: 10px;
  transform-origin: top center;
}
.hand {
  position: absolute;
  bottom: -10px; left: 0;
  width: 20px; height: 24px;
  background: var(--skin-tone);
  border-radius: 10px;
}

/* Top Styles */
.top-t-shirt .upper-arm::after {
  content: '';
  position: absolute;
  top: 0; left: -1px;
  width: 26px; height: 44px;
  background: var(--top-color);
  border-radius: 13px 13px 4px 4px;
  z-index: 1;
}
.top-crop-top .chest { height: 60%; border-radius: 30px 30px 0 0; }
.top-crop-top::after {
  content: '';
  position: absolute;
  bottom: 0; left: 10px;
  width: 60px; height: 40%;
  background: var(--skin-tone);
  border-radius: 0 0 10px 10px;
  z-index: 1;
}
.top-sweater .upper-arm, .top-sweater .lower-arm { background: var(--top-color); }
.top-sweater .hand { background: var(--skin-tone); }
.top-tank-top .upper-arm::after { display: none; }

/* --- LEGS --- */
.legs {
  position: relative;
  width: 80px;
  height: 220px;
  z-index: 2;
}
.pelvis {
  position: absolute;
  top: -10px; left: 0;
  width: 100%; height: 50px;
  background: var(--bottom-color);
  border-radius: 10px 10px 30px 30px;
  z-index: 2;
}

.leg {
  position: absolute;
  top: 20px;
  width: 32px;
}
.left-leg { left: 5px; z-index: 1; }
.right-leg { right: 5px; z-index: 3; }

.thigh {
  width: 32px;
  height: 110px;
  background: var(--bottom-color);
  border-radius: 16px;
  transform-origin: top center;
}
.calf {
  position: absolute;
  top: 100px; left: 2px;
  width: 28px;
  height: 110px;
  background: var(--skin-tone);
  border-radius: 14px;
  transform-origin: top center;
}
.shoe {
  position: absolute;
  bottom: -15px; left: -5px;
  width: 40px; height: 25px;
  background: var(--shoes-color);
  border-radius: 15px 25px 10px 10px;
}

/* Bottom Styles */
.bottom-pants .calf { background: var(--bottom-color); }
.bottom-shorts .calf { background: var(--skin-tone); }
.bottom-skirt .pelvis {
  width: 120px; height: 90px;
  left: -20px;
  border-radius: 10px 10px 20px 20px;
  clip-path: polygon(20% 0, 80% 0, 100% 100%, 0 100%);
}
.bottom-wide-pants .thigh { width: 40px; border-radius: 10px; }
.bottom-wide-pants .calf { width: 40px; left: 0; background: var(--bottom-color); border-radius: 0; }

/* --- POSES (static transforms; do not animate these nodes — see .figure-motion) --- */
.pose-standing .left-arm .upper-arm { transform: rotate(8deg); }
.pose-standing .right-arm .upper-arm { transform: rotate(-8deg); }

.pose-walking .left-arm .upper-arm { transform: rotate(22deg); }
.pose-walking .left-arm .lower-arm { transform: rotate(-14deg); }
.pose-walking .right-arm .upper-arm { transform: rotate(-28deg); }
.pose-walking .right-arm .lower-arm { transform: rotate(-18deg); }
.pose-walking .left-leg .thigh { transform: rotate(-22deg); }
.pose-walking .left-leg .calf { transform: rotate(10deg); }
.pose-walking .right-leg .thigh { transform: rotate(16deg); }
.pose-walking .right-leg .calf { transform: rotate(14deg); }

.pose-waving .right-arm .upper-arm { transform: rotate(-92deg); }
.pose-waving .right-arm .lower-arm { transform: rotate(-24deg); }
.pose-waving .left-arm .upper-arm { transform: rotate(10deg); }
.pose-waving .left-arm .lower-arm { transform: rotate(-6deg); }

.pose-sitting .figure-inner { transform: translateY(36px); }
.pose-sitting .thigh { transform: rotate(68deg); }
.pose-sitting .calf { transform: rotate(-82deg); }
.pose-sitting .leg { top: 28px; }
.pose-sitting .left-leg { left: 2px; }
.pose-sitting .right-leg { right: 2px; }

.pose-running .torso { transform: rotate(12deg); }
.pose-running .left-arm .upper-arm { transform: rotate(52deg); }
.pose-running .left-arm .lower-arm { transform: rotate(-62deg); }
.pose-running .right-arm .upper-arm { transform: rotate(-52deg); }
.pose-running .right-arm .lower-arm { transform: rotate(-62deg); }
.pose-running .left-leg .thigh { transform: rotate(-52deg); }
.pose-running .left-leg .calf { transform: rotate(36deg); }
.pose-running .right-leg .thigh { transform: rotate(36deg); }
.pose-running .right-leg .calf { transform: rotate(72deg); }

/* --- DIRECTIONS --- */
.dir-front .face { border-radius: 40px; }
.dir-front .ear { display: none; }
.dir-front .eye { left: 15px; box-shadow: 24px 0 0 #222; }
.dir-front .nose { left: 26px; }
.dir-front .mouth { left: 24px; }

.dir-back .face { background: var(--hair-color); }
.dir-back .eye, .dir-back .nose, .dir-back .mouth { display: none; }

/* --- ACCESSORIES --- */
.accessory {
  position: absolute;
  z-index: 5;
}
.acc-laptop {
  bottom: -5px; left: -10px;
  width: 40px; height: 30px;
  background: #ccc;
  border-radius: 4px;
  transform: rotate(-20deg);
}
.acc-coffee {
  bottom: 0; left: -5px;
  width: 16px; height: 24px;
  background: #fff;
  border-radius: 2px 2px 4px 4px;
}
.acc-coffee::after {
  content: ''; position: absolute;
  top: -4px; left: -2px;
  width: 20px; height: 6px;
  background: #333; border-radius: 2px;
}
.acc-book {
  bottom: -10px; left: -10px;
  width: 30px; height: 40px;
  background: var(--theme-color);
  border-radius: 2px 6px 6px 2px;
  transform: rotate(15deg);
}
.acc-phone {
  bottom: 5px; left: 0;
  width: 12px; height: 20px;
  background: #333;
  border-radius: 2px;
}
.acc-yoga-mat {
  bottom: -20px; left: -10px;
  width: 20px; height: 80px;
  background: var(--theme-color);
  border-radius: 10px;
  transform: rotate(45deg);
}

/* --- ANIMATIONS (only .figure-motion — keeps limb pose transforms intact) --- */
@keyframes ff-breathe {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(-4px) scaleY(1.02); }
}
.anim-breathe .figure-motion {
  animation: ff-breathe 3s ease-in-out infinite;
}

@keyframes ff-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}
.anim-float .figure-motion {
  animation: ff-float 4s ease-in-out infinite;
}

@keyframes ff-walk-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
.anim-walk .figure-motion {
  animation: ff-walk-bob 0.7s ease-in-out infinite;
}

@keyframes ff-wave-forearm {
  0%, 100% { transform: rotate(-24deg); }
  50% { transform: rotate(-6deg); }
}
.anim-wave .right-arm .lower-arm {
  animation: ff-wave-forearm 0.75s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes ff-pulse {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% { filter: drop-shadow(0 10px 16px color-mix(in srgb, var(--theme-color) 45%, transparent)); }
}
.anim-pulse .figure-motion {
  animation: ff-pulse 2.8s ease-in-out infinite;
}

@keyframes ff-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.anim-spin .figure-motion {
  animation: ff-spin 14s linear infinite;
}

/* --- FIGURE THEMES (visual variants) --- */
.ff-geometric .chest { border-radius: 14px 14px 6px 6px; }
.ff-geometric .face { border-radius: 18px 18px 22px 22px; }
.ff-geometric .upper-arm,
.ff-geometric .lower-arm,
.ff-geometric .thigh,
.ff-geometric .calf,
.ff-geometric .hand,
.ff-geometric .shoe { border-radius: 8px; }
.ff-geometric .pelvis { border-radius: 8px 8px 16px 16px; }

.ff-soft .chest {
  box-shadow: 6px 10px 0 color-mix(in srgb, var(--top-shadow) 28%, transparent);
}
.ff-soft .pelvis {
  box-shadow: 4px 7px 0 color-mix(in srgb, var(--bottom-shadow) 25%, transparent);
}
.ff-soft .face {
  box-shadow: inset -5px -6px 0 color-mix(in srgb, var(--skin-shadow) 18%, transparent);
}
.ff-soft .upper-arm,
.ff-soft .lower-arm,
.ff-soft .thigh,
.ff-soft .calf { border-radius: 14px; }

.ff-outline .face,
.ff-outline .neck,
.ff-outline .upper-arm,
.ff-outline .lower-arm,
.ff-outline .hand,
.ff-outline .calf {
  background: color-mix(in srgb, var(--skin-tone) 38%, var(--bg-color));
  border: 2px solid var(--skin-shadow);
  box-sizing: border-box;
}
.ff-outline .chest {
  background: color-mix(in srgb, var(--top-color) 35%, var(--bg-color));
  border: 3px solid var(--top-color);
  box-sizing: border-box;
}
.ff-outline .thigh,
.ff-outline .pelvis {
  background: color-mix(in srgb, var(--bottom-color) 35%, var(--bg-color));
  border: 2px solid var(--bottom-color);
  box-sizing: border-box;
}
.ff-outline .shoe {
  background: color-mix(in srgb, var(--shoes-color) 40%, var(--bg-color));
  border: 2px solid color-mix(in srgb, var(--shoes-color) 70%, black);
  box-sizing: border-box;
}
.ff-outline .hair-front,
.ff-outline .hair-back {
  border: 2px solid color-mix(in srgb, var(--hair-color) 75%, black);
  background: color-mix(in srgb, var(--hair-color) 40%, var(--bg-color));
  box-sizing: border-box;
}
.ff-outline .top-t-shirt .upper-arm::after {
  border: 2px solid var(--top-color);
  background: color-mix(in srgb, var(--top-color) 40%, var(--bg-color));
  box-sizing: border-box;
}

.ff-pixel .head,
.ff-pixel .torso,
.ff-pixel .legs,
.ff-pixel .upper-arm,
.ff-pixel .lower-arm,
.ff-pixel .hand,
.ff-pixel .thigh,
.ff-pixel .calf,
.ff-pixel .shoe,
.ff-pixel .chest,
.ff-pixel .pelvis,
.ff-pixel .face,
.ff-pixel .hair-front,
.ff-pixel .hair-back {
  border-radius: 2px;
}
.ff-pixel .eye { border-radius: 0; width: 5px; height: 5px; }
`;

  return { html, css };
}

function compileGeometricLandscape(spec: GeometricLandscape): { html: string; css: string } {
  const { themeColor, backgroundColor, animation, timeOfDay, terrainType } = spec;

  let sunColor = "#FFD700";
  let skyGradient = "";
  
  if (timeOfDay === "day") {
    skyGradient = `linear-gradient(to bottom, #87CEEB, ${backgroundColor})`;
    sunColor = "#FFDF00";
  } else if (timeOfDay === "night") {
    skyGradient = `linear-gradient(to bottom, #0B0B2A, ${backgroundColor})`;
    sunColor = "#F4F6F0"; // Moon
  } else if (timeOfDay === "sunset") {
    skyGradient = `linear-gradient(to bottom, #FF7E5F, #FEB47B, ${backgroundColor})`;
    sunColor = "#FF4500";
  } else if (timeOfDay === "dawn") {
    skyGradient = `linear-gradient(to bottom, #A1C4FD, #C2E9FB, ${backgroundColor})`;
    sunColor = "#FFA07A";
  }

  const html = `
<div class="art-container ${animation !== 'none' ? `anim-${animation}` : ''}">
  <div class="sky">
    <div class="celestial-body"></div>
    ${timeOfDay === 'night' ? '<div class="stars"></div>' : ''}
  </div>
  <div class="terrain terrain-${terrainType}">
    <div class="layer layer-1"></div>
    <div class="layer layer-2"></div>
    <div class="layer layer-3"></div>
  </div>
</div>
`;

  const css = `
:root {
  --theme-color: ${themeColor};
  --bg-color: ${backgroundColor};
  --sun-color: ${sunColor};
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #111;
}

.art-container {
  position: relative;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  background: ${skyGradient};
}

.sky {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.celestial-body {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  background: var(--sun-color);
  border-radius: 50%;
  box-shadow: 0 0 60px var(--sun-color);
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 200px 200px;
  opacity: 0.8;
}

.terrain {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
}

.layer {
  position: absolute;
  bottom: 0;
  width: 100%;
}

/* Mountains */
.terrain-mountains .layer-1 {
  height: 80%;
  background: linear-gradient(135deg, var(--theme-color) 0%, #222 100%);
  clip-path: polygon(0% 100%, 0% 40%, 20% 10%, 40% 50%, 60% 20%, 80% 60%, 100% 30%, 100% 100%);
  z-index: 1;
}
.terrain-mountains .layer-2 {
  height: 60%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-color) 60%, black) 0%, #111 100%);
  clip-path: polygon(0% 100%, 0% 60%, 30% 20%, 50% 70%, 70% 30%, 100% 50%, 100% 100%);
  z-index: 2;
}
.terrain-mountains .layer-3 {
  height: 40%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-color) 30%, black) 0%, #000 100%);
  clip-path: polygon(0% 100%, 0% 30%, 40% 10%, 80% 40%, 100% 20%, 100% 100%);
  z-index: 3;
}

/* City */
.terrain-city .layer-1 {
  height: 70%;
  background: var(--theme-color);
  clip-path: polygon(0 100%, 0 40%, 10% 40%, 10% 20%, 20% 20%, 20% 50%, 30% 50%, 30% 10%, 40% 10%, 40% 60%, 50% 60%, 50% 30%, 60% 30%, 60% 15%, 70% 15%, 70% 45%, 80% 45%, 80% 25%, 90% 25%, 90% 55%, 100% 55%, 100% 100%);
  z-index: 1;
  opacity: 0.5;
}
.terrain-city .layer-2 {
  height: 50%;
  background: color-mix(in srgb, var(--theme-color) 70%, black);
  clip-path: polygon(0 100%, 0 30%, 15% 30%, 15% 10%, 25% 10%, 25% 40%, 35% 40%, 35% 20%, 45% 20%, 45% 50%, 55% 50%, 55% 15%, 65% 15%, 65% 35%, 75% 35%, 75% 5%, 85% 5%, 85% 45%, 100% 45%, 100% 100%);
  z-index: 2;
  opacity: 0.8;
}
.terrain-city .layer-3 {
  height: 30%;
  background: #111;
  clip-path: polygon(0 100%, 0 20%, 12% 20%, 12% 5%, 22% 5%, 22% 30%, 32% 30%, 32% 15%, 42% 15%, 42% 40%, 52% 40%, 52% 10%, 62% 10%, 62% 25%, 72% 25%, 72% 0%, 82% 0%, 82% 35%, 100% 35%, 100% 100%);
  z-index: 3;
}

/* Desert */
.terrain-desert .layer-1 {
  height: 60%;
  background: var(--theme-color);
  border-radius: 50% 50% 0 0 / 20% 20% 0 0;
  transform: scaleX(1.5) translateX(-10%);
  z-index: 1;
}
.terrain-desert .layer-2 {
  height: 40%;
  background: color-mix(in srgb, var(--theme-color) 80%, black);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  transform: scaleX(1.2) translateX(10%);
  z-index: 2;
}
.terrain-desert .layer-3 {
  height: 20%;
  background: color-mix(in srgb, var(--theme-color) 60%, black);
  border-radius: 50% 50% 0 0 / 40% 40% 0 0;
  z-index: 3;
}

/* Ocean */
.terrain-ocean .layer-1 {
  height: 50%;
  background: var(--theme-color);
  z-index: 1;
}
.terrain-ocean .layer-2 {
  height: 30%;
  background: color-mix(in srgb, var(--theme-color) 80%, white);
  opacity: 0.5;
  z-index: 2;
  animation: wave 4s ease-in-out infinite alternate;
}
.terrain-ocean .layer-3 {
  height: 15%;
  background: color-mix(in srgb, var(--theme-color) 60%, white);
  opacity: 0.7;
  z-index: 3;
  animation: wave 3s ease-in-out infinite alternate-reverse;
}

@keyframes wave {
  0% { transform: translateY(0) scaleY(1); }
  100% { transform: translateY(10px) scaleY(1.1); }
}

/* Animations */
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.anim-breathe .art-container { animation: breathe 8s ease-in-out infinite; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
.anim-float .art-container { animation: float 6s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 20px 80px var(--theme-color); }
}
.anim-pulse .art-container { animation: pulse 4s ease-in-out infinite; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.anim-spin .celestial-body { animation: spin 20s linear infinite; transform-origin: 50% 300px; }
`;

  return { html, css };
}
