class LCanvas {
  constructor(rootEl, size = [400, 400]) {
    this.rootEl = rootEl;
    this.size = size;
    this.canvasEl = null;
    this.ctx = null;

    this._init();
    this.resize(size);
  }
  _init() {
    this.canvasEl = document.createElement("canvas");
    this.rootEl.appendChild(this.canvasEl);
    this.ctx = this.canvasEl.getContext("2d");
  }
  resize(size) {
    this.size = size;
    [this.canvasEl.width, this.canvasEl.height] = size;
  }
  getRect() {
    const { x, y, left, top, width, height } =
      this.canvasEl.getBoundingClientRect();
    return { pos: [left, top], size: [width, height] };
  }
  drawImage({ image, spos, ssize, dpos, dsize }) {
    spos ??= [0, 0];
    ssize ??= [image.naturalWidth, image.naturalHeight];
    dpos ??= [0, 0];
    dsize ??= this.size;
    this.ctx.drawImage(image, ...spos, ...ssize, ...dpos, ...dsize);
  }
  drawLine({ spos, epos, color }) {
    this.ctx.save();

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    this.ctx.beginPath();

    this.ctx.moveTo(...spos);
    this.ctx.lineTo(...epos);

    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.restore();
  }
  drawGrid({ size, color }) {
    const csize = this.size.map((_, i) => this.size[i] / size[i]);
    for (let i = 0; i < size[0]; i++) {
      const spos = [i * csize[0], 0];
      const epos = [i * csize[0], this.size[1]];
      this.drawLine({ spos, epos, color });
    }
    for (let i = 0; i < size[1]; i++) {
      const spos = [0, i * csize[1]];
      const epos = [this.size[0], i * csize[1]];
      this.drawLine({ spos, epos, color });
    }
  }
  downalod(fname) {
    const link = document.createElement("a");
    link.download = fname;
    link.href = this.canvasEl.toDataURL();
    link.click();
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const jimg = { img, size: [img.naturalWidth, img.naturalHeight] };
      resolve(jimg);
    };
    img.onerror = () => {
      reject(new Error(`Failed to load: ${src}`));
    };
    img.src = src;
  });
}

function _reverse(arr) {
  if (!arr) {
    return arr;
  }
  return [...arr].reverse();
}

async function main() {
  // const SRC = "../assets/images/gems2.png";
  // const GRID_SIZE = [5, 3];
  // const SRC = "../assets/images/cracks_a.png";
  // const GRID_SIZE = [2, 3];
  // const SPRITE_SIZE = [16, 16];
  const SRC = "../assets/images/gems2.png";
  const GRID_SIZE = [5,3];
  const SPRITE_SIZE = [16, 16];

  const rootEl = document.querySelector(".screen");
  const spriteSheetSize = [400, 400];
  const lcanvas = new LCanvas(rootEl);
  lcanvas.resize([400, 400]);
  const rect = lcanvas.getRect();
  console.log(rect);

  const jimg = await loadImage(SRC);
  console.log("img", jimg);
  const aspect = jimg.size[0] / jimg.size[1];
  const dsize = [spriteSheetSize[0], spriteSheetSize[1] / aspect];
  lcanvas.resize(dsize);
  const gsize = GRID_SIZE;
  const cSrcSize = jimg.size.map((_, i) => jimg.size[i] / gsize[i]);
  let selected = null;

  render();

  lcanvas.canvasEl.addEventListener("click", (e) => {
    const clientPos = [e.clientX, e.clientY];
    const rect = lcanvas.getRect();
    const clickPos = clientPos.map((_, i) => clientPos[i] - rect.pos[i]);
    const csize = rect.size.map((_, i) => rect.size[i] / gsize[i]);
    const cpos = clickPos.map((_, i) => Math.floor(clickPos[i] / csize[i]));
    selected = selected ? null : cpos;
    render();
  });

  const desiredSize = SPRITE_SIZE;

  function render() {
    if (selected) {
      lcanvas.resize(desiredSize);
      const spos = desiredSize.map((_, i) => selected[i] * cSrcSize[i]);
      lcanvas.drawImage({ image: jimg.img, spos, ssize: cSrcSize });
      return;
    }
    lcanvas.resize(dsize);
    lcanvas.drawImage({ image: jimg.img });
    lcanvas.drawGrid({ size: gsize });
  }

  const btn = document.createElement("button");
  const main = document.querySelector("main");

  main.appendChild(btn);
  btn.textContent = "downaload";
  function getCurrentSpriteName() {
    const srcFname = SRC.split("/").at(-1);
    const [bname, ext] = srcFname.split(".");
    if (!selected) {
      return `${bname}_ss.${ext}`;
    }
    const skey = selected.join("_");
    return `${bname}_${skey}.${ext}`;
  }
  btn.addEventListener("click", () => {
    const fname = getCurrentSpriteName();
    const name = prompt("fname", fname);
    if (!name) {
      return;
    }
    lcanvas.downalod(name);
  });
}

main();
