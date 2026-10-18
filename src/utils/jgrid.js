import * as jutils from "./utils.js";
/**
.container {
  position: relative;
}
.grid {
  display: grid;
  gap: 2px;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  grid-template-rows: repeat(var(--grid-rows), 1fr);
}
.cell {
  aspect-ratio: 1;

  background-image: var(--bg-url);
  background-size: cover;
  image-rendering: pixelated;

  background-color: var(--bg-color);

  color: var(--fg-color);
}

.obj {
  position: absolute;
  aspect-ratio: 1;
  animation: shiver 0.3s infinite linear;
}
 */

const stylePropertyMap = {
  bgUrl: "--bg-url",
  bgColor: "--bg-color",
  fgColor: "--fg-color",
};

function updateProps(el, info) {
  Object.entries(stylePropertyMap).forEach(([name, prop]) => {
    const val = info.style?.[name];
    if (val === null || val === undefined) {
      el.style.removeProperty(prop);
    } else {
      el.style.setProperty(prop, val);
    }
  });

  el.textContent = info.textContent ?? "";
}

export class JGridView {
  constructor(rootEl, size) {
    this.rootEl = rootEl;
    this.size = size;

    this.gridEl = null;
    this.cellEls = null;

    this._init();
  }
  _init() {
    const { rootEl, size } = this;
    // rootEl.innerHtml = "";
    const gridEl = document.createElement("div");
    rootEl.appendChild(gridEl);
    this.gridEl = gridEl;
    gridEl.classList.add("grid");
    gridEl.style.setProperty("--grid-rows", `${size[0]}`);
    gridEl.style.setProperty("--grid-columns", `${size[1]}`);

    this.cellEls = jutils.jrange(size[0] * size[1]).map((i) => {
      const div = document.createElement("div");
      gridEl.appendChild(div);
      div.classList.add("cell");
      return div;
    });
  }
  resize(size) {
    this.dispose();

    this.size = size;
    this._init();
  }
  dispose() {
    this.gridEl.remove();
  }
  renderGrid(key2info) {
    jutils.jrange(this.size[0]).forEach((ri) => {
      jutils.jrange(this.size[1]).forEach((ci) => {
        const pos = [ri, ci];
        const key = jutils.jpos2key(pos);

        const info = key2info[key] ?? {};
        const idx = jutils.pos2idx(pos, this.size);
        const cellEl = this.cellEls[idx];

        updateProps(cellEl, info);

        if (info.innerHTML) {
          cellEl.innerHTML = info.innerHTML;
        } else {
          cellEl.textContent = info.textContent ?? "";
        }
      });
    });
  }
  getCellByKey(key) {
    const { cellEls, size } = this;
    const pos = jutils.jkey2pos(key);
    const idx = jutils.pos2idx(pos, size);
    if (idx < 0 || idx >= cellEls.length) {
      return null;
    }
    return cellEls[idx];
  }
  setGridBg(url) {
    this.gridEl.style.setProperty("--g-bg-url", `${url}`);
  }
}

// export class JAbsView {
//   constructor(rootEl, size) {
//     this.rootEl = rootEl;
//     this.size = size;

//     this.id2el = {};

//     // this._init();
//   }
//   resize(size) {
//     this.size = size;
//   }
//   dispose() {
//     Object.values(this.id2el).forEach((el) => el.remove());
//     this.id2el = {};
//   }
//   create(id) {
//     const el = document.createElement("div");
//     this.rootEl.appendChild(el);
//     this.id2el[id] = el;

//     el.classList.add("obj", "cell");
//     return el;
//   }
//   remove(id) {
//     const el = this.id2el[id];
//     el.remove();
//     delete this.id2el[id];
//   }
//   update(id, pos, info) {
//     const el = this.id2el[id];
//     updateProps(el, info);
//     const percentPos = pos.map((_, i) =>
//       Math.floor(100 * (pos[i] / this.size[i])),
//     );
//     el.style.setProperty("top", `${percentPos[0]}%`);
//     el.style.setProperty("left", `${percentPos[1]}%`);
//   }
// }

export class AbsRenderer {
  constructor(rootEl) {
    this.rootEl = rootEl;

    this.containerEl = null;
    this.keySeq = 1;
    this.key2el = {};
    this.key2info = {};
    this.key2style = {};
    this._init();
  }
  _init() {
    const containerEl = document.createElement("div");
    containerEl.classList.add("abs-container");
    this.containerEl = containerEl;
    this.rootEl.appendChild(containerEl);
    this.key2info = {};
  }
  createView() {
    const key = `${this.keySeq++}`;
    const objEl = document.createElement("div");
    objEl.classList.add("abs-obj", "abs-obj_square");
    this.containerEl.appendChild(objEl);
    this.key2el[key] = objEl;
    return key;
  }
  update() {
    Object.keys(this.key2el).forEach((key) => {
      this._update(key);
    });
  }
  _update(key) {
    const info = this.key2info[key] ?? { pos: [-1, -1], size: [0, 0] };
    const { pos, size, color, angle, url } = info;

    const style = {};
    function toPercent(val) {
      return (val * 100).toFixed(2);
    }
    if (size) {
      style["--width"] = `${toPercent(size[0])}%`;
      style["--height"] = `${toPercent(size[1])}%`;
    }
    if (pos) {
      style["--top"] = `${toPercent(pos[0])}%`;
      style["--left"] = `${toPercent(pos[1])}%`;
    }

    if (color) {
      style["--color"] = `${color}`;
    }
    if (angle !== undefined) {
      style["--angle"] = `${angle.toFixed(2)}rad`;
    }
    if (url) {
      style["--url"] = `${url}`;
    }

    this._updateStyle(key, style);
  }
  _updateStyle(key, style) {
    const objEl = this.key2el[key];
    const pstyle = this.key2style[key];
    Object.entries(style).forEach(([key, val]) => {
      const pval = pstyle?.[key];
      if (val === pval) {
        return;
      }
      objEl.style.setProperty(key, val);
    });
    this.key2style[key] = style;
  }
}
