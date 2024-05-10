import { getDiamondAreaSample, writePelletsCSV } from "./utils.ts";

const pellets = getDiamondAreaSample(20n, 30n, 0.15);
writePelletsCSV(pellets, "tests/admin/pellets/sample1.csv");
