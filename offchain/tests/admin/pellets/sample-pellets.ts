import { getDiamondAreaSample, writePelletsCSV } from "./utils.ts";

const pellets = getDiamondAreaSample(50n, 80n, 10n, 1n, 0.2);
writePelletsCSV(pellets, "tests/admin/pellets/sample4.csv");
