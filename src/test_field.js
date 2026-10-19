import * as jutils from "./utils/utils.js";
import { BLOCK_TO_COLOR, JField, biomConfig } from "./core/field.js";
import { RenderSystem } from "./utils/jgrender.js";
import { JBlocks } from "./utils/jblocks.js";
import { JVBowl } from "./core/bowl.js";

const urls = [];
jutils.jrange(3).forEach((ri) =>
  jutils.jrange(2).forEach((ci) => {
    urls.push(`../../assets/images/gems2_${ri}_${ci}.png`);
  }),
);

function main() {
  const bowl = new JVBowl(document.getElementById("bowl"));
  bowl.start();

  const seed = 42;
  const view = {
    size: [4, 4],
    pos: [0, 0],
    caveCount: 0,
    broken: 0,
    score: 0,
  };
  const fallThld = 0.5;
  const totalCount = view.size[0] * view.size[1];

  const field = new JField(seed, view.size[0]);
  const blocks = new JBlocks((pos) => {
    const name = field.at(pos);
    return { name };
  });

  const fieldEl = document.getElementById("field");
  const renderSystem = new RenderSystem(fieldEl);
  renderSystem.resize(view.size);

  const { gridEl } = renderSystem.grid;
  gridEl.addEventListener("click", handleClick);
  function handleClick(e) {
    const clientPos = [e.clientY, e.clientX];
    const brect = gridEl.getBoundingClientRect();
    const fsize = [brect.height, brect.width];
    const fpos = [brect.top, brect.left];
    const mpos = jutils.subV(clientPos, fpos);

    const { size: vsize, pos: vpos } = view;
    const cellSize = jutils.divV(fsize, vsize);
    const cellPos = mpos.map((_, i) => Math.floor(mpos[i] / cellSize[i]));

    const wpos = jutils.addV(vpos, cellPos);

    _handleClickBlock(wpos);
    // blocks.set(wpos, { name: "cave" });
    render();
  }

  let gemProbs = [urls.length, ...[...new Array(urls.length)].map(() => 1)];
  const gemProbsS = gemProbs.reduce((s, x) => s + x);
  gemProbs = gemProbs.map((v) => v / gemProbsS);

  // fall = shift pos[0] down by size[0]
  function _handleClickBlock(wpos) {
    const info = blocks.at(wpos);
    const newInfo = { ...info };
    if (!newInfo.name || newInfo.name === "cave") {
      return;
    }
    if (newInfo.idx === undefined) {
      newInfo.idx = 0;
    }
    let step = 1;
    if (["soil", "dirt"].includes(newInfo.name)) {
      step = 2;
    }
    if (["sand", "mushroom"].includes(newInfo.name)) {
      step = 3;
    }
    newInfo.idx += step;
    if (newInfo.name.startsWith("gem")) {
      const b = bowl.addBox();
      setTimeout(() => {
        view.score += 100 + Math.floor(field.rng.random() * 10) * 10
        const scoreEl = document.getElementById('score');
        scoreEl.textContent = `$${view.score}`;
        bowl.disposeBox(b);
      }, 5000);
      b.url = newInfo.bgUrl;
      newInfo.name = "cave";
      newInfo.bgUrl = null;
      view.broken++;
      blocks.set(wpos, newInfo);
    } else {
      if (newInfo.idx > 5) {
        const resource = field.resourceAt(wpos, gemProbs);
        console.log(resource);
        if (!resource) {
          newInfo.name = "cave";
          newInfo.bgUrl = null;
          view.broken++;
        } else {
          newInfo.name = `gem_${resource - 1}`;
          newInfo.bgUrl = `url(${urls[resource - 1]})`;
          newInfo.idx = null;
        }
        blocks.set(wpos, newInfo);
      } else {
        newInfo.bgUrl = `url(../../assets/images/cracks_a_${newInfo.idx}.png)`;
        blocks.set(wpos, newInfo);
      }
    }

    function setShiver(idx = null) {
      for (let i = 0; i < 3; i++) {
        gridEl.classList.remove(`shiver-${i}`);
      }
      if (idx !== null) {
        gridEl.classList.add(`shiver-${idx}`);
      }
    }
    // if (!view.broken) {
    //   return;
    // }

    if (view.broken && view.caveCount + view.broken >= fallThld * totalCount) {
      view.pos[0] += view.size[0];
      setUpNextLayer();
      setShiver();
      return;
    }

    if (view.caveCount + view.broken >= fallThld * 0.6 * totalCount) {
      setShiver(2);
      return;
    }

    if (view.caveCount + view.broken >= fallThld * 0.2 * totalCount) {
      setShiver(1);
      return;
    }
  }

  function setUpNextLayer() {
    // view.pos[0] += view.size[0];
    blocks.changes = {};

    view.caveCount = 0;
    jutils.jrange(view.size[1]).forEach((c) => {
      jutils.jrange(view.size[0]).forEach((r) => {
        const pos = [r, c];
        const wpos = jutils.addV(view.pos, pos);
        const info = blocks.at(wpos);
        if (info.name === "cave") {
          view.caveCount++;
        }
      });
    });
    view.broken = 0;
  }

  setUpNextLayer();
  render();

  function render() {
    console.log("render");
    const { size, pos: vpos } = view;
    const key2obj = {};
    const center = size.map((v) => Math.floor(0.5 * v));
    const wcenter = jutils.addV(vpos, center);
    const biom = field.biomAt(wcenter);
    const bgUrl = biomConfig[biom].bg;
    if (bgUrl !== view.currentBgUrl) {
      view.currentBgUrl = bgUrl;
      gridEl.style.setProperty("--g-bg-url", view.currentBgUrl);
    }

    jutils.jrange(size[1]).forEach((c) => {
      jutils.jrange(size[0]).forEach((r) => {
        const pos = [r, c];
        const wpos = jutils.addV(vpos, pos);
        const key = jutils.jpos2key(pos);
        const info = blocks.at(wpos);
        key2obj[key] = info;
      });
    });

    renderSystem.render({ key2obj }, BLOCK_TO_COLOR);
  }
}

main();
