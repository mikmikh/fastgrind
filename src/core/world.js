import * as jutils from "../utils/utils.js";
import * as jrng from "../utils/rng.js";
import { BLOCKS } from "./constants.js";

// octaves,persistence,scale

const config = {
  temperature: { noise: { o: 4, p: 0.5, s: 0.05 } },
  height: {
    noise: { o: 4, p: 0.5, s: 0.05 },
    level: 0.5,
    bioms: {
      snow: { noise: { o: 4, p: 0.5, s: 0.5 }, level: 0.5 },
      forest: { noise: { o: 4, p: 0.5, s: 0.25 }, level: 0.5 },
      desert: { noise: { o: 4, p: 0.5, s: 0.05 }, level: 0.5 },
    },
  },
  caves: {
    noise: { o: 4, p: 0.5, s: 0.5 },
    thld: 0.1,
    sthld: 0.001,
    ethld: 0.1,
    bioms: {},
  },
  resources: [
    {
      name: BLOCKS.ruby,
      thld: 0.0,
      sthld: 0.01,
      ethld: 0.1,
      bioms: {},
    },
    {
      name: BLOCKS.sapphire,
      thld: 0.0,
      sthld: 0.01,
      ethld: 0.1,
      bioms: {},
    },
    {
      name: BLOCKS.emerald,
      thld: 0.0,
      sthld: 0.01,
      ethld: 0.1,
      bioms: {},
    },
    {
      name: BLOCKS.snow,
      noise: { o: 4, p: 0.5, s: 0.5 },
      thld: 0.0,
      sthld: 0.0,
      ethld: 0.0,
      bioms: {
        snow: {
          sthld: 0.6,
          ethld: 0.4,
        },
      },
    },
    {
      name: BLOCKS.sand,
      noise: { o: 4, p: 0.5, s: 0.5 },
      thld: 0.6,
      sthld: 0.0,
      ethld: 0.0,
      bioms: {
        desert: {
          sthld: 0.8,
          ethld: 0.1,
        },
      },
    },
    {
      name: BLOCKS.iron,
      noise: { o: 4, p: 0.5, s: 0.5 },
      thld: 0.6,
      sthld: 0.1,
      ethld: 0.3,
      bioms: {},
    },
    {
      name: BLOCKS.gold,
      noise: { o: 4, p: 0.5, s: 0.5 },
      thld: 0.6,
      sthld: 0.1,
      ethld: 0.2,
      bioms: {},
    },
    {
      name: BLOCKS.stone,
      noise: { o: 4, p: 0.5, s: 0.5 },
      thld: 0.6,
      sthld: 0.3,
      ethld: 0.9,
      bioms: {},
    },
  ],
};

//

export class JWorldBuilder {
  constructor(seed = 42, size = [16, 16]) {
    this.seed = seed;
    this.size = size;

    this.rng = null; // new jrng.JRngMulberry32(seed);
    // this.simplex = new jrng.JSimplexNoise(this.rng);

    this.simplexes = {
      terrain: null,
      caves: null,
      resources: {},
    };
    this.seeds = {};

    this.key2noiseFn = {};

    this._init();
  }
  _init() {
    this.rng = new jrng.JRngMulberry32(this.seed);

    const temperatureSeed = jrng.cyrb53("temperature", this.seed);
    this.simplexes.temperature = new jrng.JSimplexNoise(
      new jrng.JRngMulberry32(temperatureSeed),
    );
    const heightSeed = jrng.cyrb53("height", this.seed);
    this.simplexes.height = new jrng.JSimplexNoise(
      new jrng.JRngMulberry32(heightSeed),
    );
    const cavesSeed = jrng.cyrb53("caves", this.seed);
    this.simplexes.caves = new jrng.JSimplexNoise(
      new jrng.JRngMulberry32(cavesSeed),
    );
    config.resources.forEach((resource) => {
      const { name, noise } = resource;
      const resourceSeed = jrng.cyrb53(name, this.seed);
      console.log(name, resourceSeed);
      this.seeds[name] = resourceSeed;
      if (!noise) {
        return;
      }
      this.simplexes.resources[name] = new jrng.JSimplexNoise(
        new jrng.JRngMulberry32(resourceSeed),
      );
    });
  }
  blockAt(pos) {
    const biom = this._biomAt(pos);
    const height = this._heightAt(pos, biom);
    const depth = pos[0] - height;
    // console.log("pos, d", pos, depth);
    if (depth <= 0) {
      return BLOCKS.sky;
    }

    const df = Math.min(1, depth / (this.size[0] - height));
    const isCave = this._caveAt(pos, df);
    if (isCave) {
      return BLOCKS.cave;
    }
    const resource = this._resourceAt(pos, df, biom);
    if (resource) {
      return resource;
    }

    if (depth < 1) {
      return BLOCKS.grass;
    }

    return BLOCKS.soil;
  }
  _biomAt(pos) {
    const { noise } = config.temperature;
    const simplex = this.simplexes.temperature;
    const r = this.__noiseAt([1, pos[1]], noise, simplex);
    if (r < 0.33) {
      return "snow";
    }
    if (r < 0.66) {
      return "forest";
    }
    return "desert";
  }
  __noiseAt(pos, noise, simplex) {
    const n = simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
    const r = (1 + n) * 0.5;
    return r;
  }
  _heightAt(pos, biom) {
    const { noise, level, bioms } = config.height;
    const noise_ = bioms?.[biom]?.noise ?? noise;
    const level_ = bioms?.[biom]?.level ?? level;
    const simplex = this.simplexes.height;
    const r = this.__noiseAt([1, pos[1]], noise_, simplex);
    const h = this.size[0] * level_;
    const height = r * h;
    return height;
  }
  _caveAt(pos, df) {
    // return false;
    const { noise, thld, sthld, ethld } = config.caves;
    const t = sthld && ethld ? sthld * (1 - df) + ethld * df : thld;
    const simplex = this.simplexes.caves;
    const cn = simplex.noise2dFractal(pos, noise.o, noise.p, noise.s);
    const isCave = cn > -t && cn < t;
    return isCave;
  }
  _resourceAt(pos, df, biom) {
    // console.log(df);
    const key = jutils.jpos2key(pos);
    for (const resource of config.resources) {
      const { name, noise, thld, sthld, ethld, bioms } = resource;
      const noise_ = bioms?.[biom]?.noise ?? noise;
      const thld_ = bioms?.[biom]?.thld ?? thld;
      const sthld_ = bioms?.[biom]?.sthld ?? sthld;
      const ethld_ = bioms?.[biom]?.ethld ?? ethld;

      const t = this.__getThld(thld_, df, sthld_, ethld_);

      let r = 0;
      if (noise_) {
        const simplex = this.simplexes.resources[name];
        r = this.__noiseAt(pos, noise_, simplex);
      } else {
        const posSeed = jrng.cyrb53(key, this.seeds[name]);
        this.rng.seed = posSeed;
        r = this.rng.random();
      }

      if (r < t) {
        return name;
      }
    }
    return null;
  }
  __getThld(thld, df, sthld, ethld) {
    if (sthld === undefined) {
      return thld;
    }

    return sthld * (1 - df) + ethld * df;
  }
  _seedAt(pos) {
    const key = jutils.jpos2key(pos);
    const seed = jrng.cyrb53(key, this.seed);
    return seed;
  }
}
// 1d noise height map
// 2d noise soil, stone
// 2d noise caves
// white noise resource seeds
// white noise tree seeds
// thlds depend on depth:
//  - depth=current_row-surfaceRow
//  - fact=d/(maxDepth-surfaceRow)

// bioms
//
