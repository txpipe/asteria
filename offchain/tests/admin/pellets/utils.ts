import { parse, stringify } from "jsr:@std/csv";

function getRandomSubarray<T>(arr: Array<T>, size: number) {
  const shuffled = arr.slice(0);
  let i = arr.length,
    temp,
    index;
  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

/**
 * Returns an array with the coordinates of a diamond (rhombus) with diagonal r.
 * Since we measure distances using the "manhattan distance", diamonds are the
 * actual "circumferences" (set of points equidistant from the center) in our geometry.
 * @param r Diamond diagonal.
 */
function getDiamondCoordinates(
  r: bigint
): Array<{ pos_x: bigint; pos_y: bigint }> {
  const cs = [];
  for (let i = 0n; i < r; i++) {
    cs.push({
      pos_x: r - i,
      pos_y: i,
    });
    cs.push({
      pos_x: -r + i,
      pos_y: -i,
    });
    cs.push({
      pos_x: -i,
      pos_y: r - i,
    });
    cs.push({
      pos_x: i,
      pos_y: -r + i,
    });
  }
  return cs;
}

/**
 * Returns an array with a random sample of pellet parameters on the perimeter
 * of a diamond with diagonal r.
 * @param r Diamond diagonal.
 * @param density Density of the sample: equals 1 if every diamond point is taken. Must be in the range 0 - 1, inclusive.
 */
function getDiamondSample(
  r: bigint,
  density: number
): Array<{ fuel: number; pos_x: bigint; pos_y: bigint }> {
  if (density > 1 || density < 0) {
    throw Error("Density must be a number between 0 and 1.");
  }
  const cs = getDiamondCoordinates(r);
  const sample_size = Math.floor(cs.length * density);
  const sample_cs = getRandomSubarray(cs, sample_size);
  const pellets = sample_cs.map((c) => ({
    fuel: Math.floor(Math.random() * 60 + 30), //random amount between 30 and 90.
    pos_x: c.pos_x,
    pos_y: c.pos_y,
  }));
  return pellets;
}

/**
 * Returns an array with a random sample of pellet parameters over the area
 * between two diamonds with diagonals inner_r and outer_r respectively.
 * @param inner_r Inner diamond diagonal. Must be greater than or equal to 0.
 * @param Outer_r Outer diamond diagonal. Must be greater than or equal to inner_r.
 * @param density Density of the sample: equals 1 if every diamond point is taken. Must be in the range 0 - 1, inclusive.
 */
function getDiamondAreaSample(
  inner_r: bigint,
  outer_r: bigint,
  density: number
): Array<{ fuel: number; pos_x: bigint; pos_y: bigint }> {
  if (inner_r < 0 || inner_r > outer_r) {
    throw Error(
      "inner_r must be a positive number less than or equal to outer_r"
    );
  }
  const pellets = [];
  for (let r = inner_r; r <= outer_r; r++) {
    pellets.push(getDiamondSample(r, density));
  }
  return pellets.flat();
}

function writePelletsCSV(
  pellets: Array<{ fuel: number; pos_x: bigint; pos_y: bigint }>,
  path: string
) {
  const csv = stringify(pellets, {
    columns: ["fuel", "pos_x", "pos_y"],
  });
  Deno.writeTextFileSync(path, csv);
}

async function readPelletsCSV(path: string) {
  const text = await Deno.readTextFile(path);
  const data = parse(text, {
    skipFirstRow: true,
    columns: ["fuel", "pos_x", "pos_y"],
  });
  const params: { fuel: bigint; pos_x: bigint; pos_y: bigint }[] = data.map(
    (p) => ({
      fuel: BigInt(p.fuel),
      pos_x: BigInt(p.pos_x),
      pos_y: BigInt(p.pos_y),
    })
  );
  return params;
}

export { getDiamondAreaSample, writePelletsCSV, readPelletsCSV };
