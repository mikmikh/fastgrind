import * as jutils from "../utils/utils.js";
import * as jrng from "../utils/rng.js";

export const biomConfig = {
  soil: {
    prob: 1,
    caves: 0.05,
    blocks: {
      soil: 0.5,
      stone: 0.3,
      ore: 0.2,
    },
    bg: `url("../../assets/images/bg-pink_0_0.png")`,
  },
  sand: {
    prob: 1,
    caves: 0.05,
    blocks: {
      sand: 0.5,
      stone: 0.3,
      fossil: 0.2,
    },
    bg: `url("../../assets/images/bg-red_0_0.png")`,
  },
  jungle: {
    prob: 1,
    caves: 0.05,
    blocks: {
      dirt: 0.5,
      stone: 0.3,
      bugs: 0.1,
      plant: 0.1,
    },
    bg: `url("../../assets/images/bg-blue_0_0.png")`,
  },
  mushroom: {
    prob: 1,
    caves: 0.05,
    blocks: {
      dirt: 0.5,
      mushroom: 0.4,
      gem: 0.1,
    },
    bg: `url("../../assets/images/bg-purple_0_0.png")`,
  },
};

const noise = {
  o: 4,
  p: 0.5,
  s: 0.5,
};

export const BLOCK_TO_COLOR = {
  soil: "#a6681b",
  stone: "#555452",
  ore: "#F2C230",
  sand: "#ffe4c9",
  fossil: "#a75c00",
  dirt: "#7A5230",
  bugs: "#00fd26",
  plant: "#0b4800",
  mushroom: "#9b00ca",
  gem: "#b40054",
  // cave: "#2c2c2c",
  cave: "",
};

export class JField {
  constructor(seed, biomSize = 16) {
    this.seed = seed;
    this.biomSize = biomSize;

    this.rng = null;
    this.simplex = null;

    this.biomNames = [];
    this.biomProbs = [];
    this.blockNames = [];

    this.biomSimplexes = {};
    this.biomCaveSimplexes = {};
    this.blockSimplexes = {};

    this._init();
  }
  _init() {
    // 3d noise
    this.rng = new jrng.JRngMulberry32(this.seed);
    this.simplex = new jrng.JSimplexNoise(new jrng.JRngMulberry32(this.seed));

    this.biomNames = Object.keys(biomConfig);

    this.blockNames = Array.from(
      new Set(
        Object.values(biomConfig).flatMap((conf) => Object.keys(conf.blocks)),
      ),
    );
    this.biomProbs = this.biomNames.map((biom) => biomConfig[biom].prob);
    const biomProbSum = this.biomProbs.reduce((s, x) => s + x);
    this.biomProbs = this.biomProbs.map((v) => v / biomProbSum);

    // Simplex
    this.biomNames.forEach((biom) => {
      this.biomSimplexes[biom] = new jrng.JSimplexNoise(
        new jrng.JRngMulberry32(jrng.cyrb53(`biom:${biom}`, this.seed)),
      );
      this.biomCaveSimplexes[biom] = new jrng.JSimplexNoise(
        new jrng.JRngMulberry32(jrng.cyrb53(`biom:${biom}:cave`, this.seed)),
      );
    });
    this.blockNames.forEach((block) => {
      const seed = jrng.cyrb53(`block:${block}`, this.seed);
      const simplex = new jrng.JSimplexNoise(new jrng.JRngMulberry32(seed));
      this.blockSimplexes[block] = simplex;
    });

    this.resourceSimplex = new jrng.JSimplexNoise(
      new jrng.JRngMulberry32(jrng.cyrb53(`resource`, this.seed)),
    );
  }

  at(pos) {
    const biom = this.biomAt(pos);
    const isCave = this.caveAt(pos, biom);
    if (isCave) {
      return "cave";
    }
    const block = this.blockAt(pos, biom);
    return block;
  }

  biomAt(pos) {
    // new
    const n = this.simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
    const r = (1 + n) * 0.5;
    const h = Math.floor(r * this.biomSize * 0.5);
    // new

    const idx = Math.floor((pos[0] + h) / this.biomSize);

    this.rng.seed = this.seed + idx;
    const bidx = jrng.pickFromProbs(this.biomProbs, this.rng);
    const biom = this.biomNames[bidx];
    return biom;
  }
  caveAt(pos, biom) {
    const simplex = this.biomCaveSimplexes[biom];
    const t = biomConfig[biom].caves;
    const n = simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
    const isCave = n > -t && n < t;
    return isCave;
  }
  blockAt(pos, biom) {
    const blocks = biomConfig[biom].blocks;
    const blockThlds = Object.entries(blocks);
    for (const [block, thld] of blockThlds) {
      const simplex = this.blockSimplexes[block];
      const n = simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
      const r = (n + 1) * 0.5;
      if (r < thld) {
        return block;
      }
    }
    return blockThlds[0][0];
  }
  resourceAt(pos, probs = [1]) {
    const n = this.simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
    const r = (1 + n) * 0.5;
    const resIdx = jrng.pickFromProbs_(probs, r);
    return resIdx;
  }
}
