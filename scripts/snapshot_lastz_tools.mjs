#!/usr/bin/env node

import fs from "node:fs/promises";
import vm from "node:vm";

const RESEARCH_BUNDLE_URL = "https://last-z.us/assets/index-CLQyimpO.js";
const STRESSWAR_TANK_CHUNK_URL = "https://lastz.stresswar.com/assets/tank-D-jfglPM.js";

function extractArrayLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not find ${marker}`);
  }

  const start = source.indexOf("[", markerIndex + marker.length);
  if (start === -1) {
    throw new Error(`Could not find array after ${marker}`);
  }

  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Unterminated array after ${marker}`);
}

function evaluateLiteral(literal) {
  return vm.runInNewContext(`(${literal})`, Object.create(null), {
    timeout: 2_000,
  });
}

function normalizeResearchTrees(trees) {
  const normalized = trees.map((tree) => {
    const nodes = tree.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      maxLevel: node.maxLevel,
      parents: node.parents || [],
      position: node.position || { x: 0, y: 0 },
      badgeCost: node.badgeCost || [],
      stats: node.stats || [],
    }));
    return {
      id: tree.id,
      name: tree.name,
      description: tree.description || "",
      totalBadges: tree.totalBadges,
      totalLevels: tree.totalLevels,
      unlockRequirements: tree.unlockRequirements || [],
      edges: nodes.flatMap((node) => node.parents.map((source) => ({ source, target: node.id }))),
      nodes,
    };
  });

  // Stresswar's May 2026 Shooter Training update filled the previously unknown
  // level-5 badge cost on the final Alert Formation node. The structured public
  // mirror still carries null at that position, so keep the live Stresswar value.
  const shooterTree = normalized.find((tree) => tree.id === "shooter-training");
  const finalAlertFormation = shooterTree?.nodes.at(-1);
  if (finalAlertFormation?.id === "alert-formation-lab-29") {
    finalAlertFormation.badgeCost[4] = 5_600;
    shooterTree.totalBadges = 1_357_180;
  }

  return normalized;
}

function normalizeTankData(modifications) {
  return modifications.map((item) => ({
    id: item.id || `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.level}`,
    name: item.name,
    level: item.level,
    modificationRating: item.modificationRating,
    wrenchesPerSubLevel: item.wrenchesPerSubLevel,
    subLevels: item.subLevels,
    totalWrenches: item.totalWrenches,
    cumulativeTotal: item.cumulativeTotal,
    isSpecialVehicle: [45, 95, 145, 195].includes(item.level),
  }));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "FL2 community planner data audit" },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.text();
}

const [researchSource, tankSource] = await Promise.all([
  fetchText(RESEARCH_BUNDLE_URL),
  fetchText(STRESSWAR_TANK_CHUNK_URL),
]);

const researchTrees = normalizeResearchTrees(
  evaluateLiteral(extractArrayLiteral(researchSource, "const fa=")),
);
const tankModifications = normalizeTankData(
  evaluateLiteral(extractArrayLiteral(tankSource, "J =")),
);

await fs.mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await Promise.all([
  fs.writeFile(
    new URL("../public/data/research-trees.json", import.meta.url),
    `${JSON.stringify({
      source: "Stresswar-derived public community data; structured baseline from Last Z Platform",
      capturedAt: new Date().toISOString(),
      trees: researchTrees,
    }, null, 2)}\n`,
  ),
  fs.writeFile(
    new URL("../public/data/tank-modifications.json", import.meta.url),
    `${JSON.stringify({
      source: "Last Z Helper by Stresswar",
      capturedAt: new Date().toISOString(),
      totalWrenches: tankModifications.at(-1)?.cumulativeTotal || 0,
      modifications: tankModifications,
    }, null, 2)}\n`,
  ),
]);

console.log(`Saved ${researchTrees.length} research trees and ${tankModifications.length} tank stages.`);
