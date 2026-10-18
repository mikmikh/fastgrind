import * as jutils from "../utils/utils.js";
import * as jverlet from "../utils/verlet.js";
import { AbsRenderer } from "../utils/jgrid.js";

const imageUrls = [
  "/assets/images/gems2_0_0.png",
  "/assets/images/gems2_1_0.png",
  "/assets/images/gems2_3_1.png",
];
const imageBagUrl = "../../assets/images/bag.png";

function _getViewPos(wpos, size) {
  const start = jutils.subV(wpos, size);
  const pos = jutils.mulS(jutils.addV(start, [1, 1]), 0.5);
  return pos;
}

export class JVBowl {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.prevT = -1;
    this.running = false;
    this.stepT = 0.025;
    this.boxes = [];

    this.animate = this._animate.bind(this);

    this.solver = null;
    this.renderer = null;
    this._init();
  }
  start() {
    this.prevT = -1;
    this.running = true;
    requestAnimationFrame(this.animate);
  }
  stop() {
    this.running = false;
  }
  addBox(pos = null) {
    const a = (Math.random() + 0.5) * Math.PI * 0.5;
    const v = [0, 0.8];
    pos ??= jutils.rotateV(v, a);
    const box = new jverlet.JBox(pos, [0.1, 0.1]);
    box.addToSolver(this.solver);
    box.objects.forEach((vobj) => {
      vobj.color = "purple";
      vobj.key = this.renderer.createView();
    });
    box.key = this.renderer.createView();

    box.objects.forEach((vobj) => {
      vobj.pkey = box.key;
    });

    this.boxes.push(box);
    return box;
  }
  disposeBox(box) {
    this.renderer.key2el[box.key].remove();
    delete this.renderer.key2el[box.key];
    box.objects.forEach((obj) => {
      this.renderer.key2el[obj.key].remove();
      delete this.renderer.key2el[obj.key];
    });
    box.removeFromSolver(this.solver);
  }
  _init() {
    this.solver = new jverlet.Solver({ gravity: [10, 0] });
    this.renderer = new AbsRenderer(this.rootEl);
    this.renderer.containerEl.classList.add("bg-image");
    this.renderer.containerEl.style.setProperty(
      "--bg-url",
      `url(${imageBagUrl})`,
    );
    this.renderer.containerEl.addEventListener("click", () => this._shuffle());
  }
  _animate(t) {
    if (!this.running) {
      return;
    }
    requestAnimationFrame(this.animate);

    if (this.prevT < 0) {
      this.prevT = t;
    }
    const dt = (t - this.prevT) * 0.001;
    if (dt < this.stepT) {
      return;
    }
    this.prevT = t;
    this._update(this.stepT);
    this._render();
  }
  _update(dt) {
    this.solver.update(dt);

    this.boxes.forEach((box, bi) => {
      const angleR = box.getAngle();
      const angle = angleR; // `${angleR}rad`;
      box.objects.forEach((vobj) => {
        const size = [vobj.radius, vobj.radius];
        const pos = _getViewPos(vobj.pos, size);
        const info = {
          pos,
          size,
          angle,
          color: "rgba(0,255,0,0.15)",
        };
        this.renderer.key2info[vobj.key] = info;
      });

      const wpos = box.getPosition();
      const pos = _getViewPos(wpos, box.size);
      const url = box.url ?? `url(${imageUrls[bi % imageUrls.length]})`;
      const info = {
        pos,
        size: jutils.mulS(box.size, 1.1),
        angle,
        // color: "rgba(255,0,0,0.5)",
        url: url,
      };
      this.renderer.key2info[box.key] = info;
    });
  }
  _render() {
    this.renderer.update();
  }
  _shuffle() {
    this.boxes.forEach((box) => {
      box.objects.forEach((obj) => {
        obj.force = [-100, 0];
      });
    });
    setTimeout(() => {
      this.boxes.forEach((box) => {
        box.objects.forEach((obj) => {
          obj.force = null;
        });
      });
    }, 200);
  }
}