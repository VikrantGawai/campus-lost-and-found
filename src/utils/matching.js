/**
 * Smart Matching Algorithm
 *
 * Rule-based matching that compares lost and found items using:
 * 1. Category similarity
 * 2. Name/description keyword overlap
 * 3. Location proximity
 * 4. Date proximity
 *
 * Each factor produces a score from 0–1, weighted and combined.
 * Results are ranked and include human-readable explanations.
 */

import { ITEM_STATUSES } from '../config/constants.js';

// ─── Text utilities ─────────────────────────────────────────────

/** Normalize text: lowercase, collapse whitespace, remove punctuation */
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract meaningful keywords (length > 2, skip stop words) */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'it', 'my', 'was', 'has', 'had', 'have',
  'been', 'this', 'that', 'from', 'are', 'were', 'will', 'can', 'not',
  'near', 'found', 'lost', 'item', 'think', 'may', 'might', 'also',
  'very', 'just', 'some', 'one', 'its', 'about', 'like',
]);

function extractKeywords(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ─── Scoring functions ──────────────────────────────────────────

/** Category match: 1 if exact, 0 otherwise */
function categoryScore(a, b) {
  if (!a || !b) return 0;
  return normalize(a) === normalize(b) ? 1 : 0;
}

/** Keyword overlap using Jaccard-like similarity */
function keywordScore(textA, textB) {
  const kwA = new Set(extractKeywords(textA));
  const kwB = new Set(extractKeywords(textB));
  if (kwA.size === 0 && kwB.size === 0) return 0;
  const intersection = [...kwA].filter((w) => kwB.has(w));
  const union = new Set([...kwA, ...kwB]);
  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

/** Location similarity: checks overlap between locations */
function locationScore(itemA, itemB) {
  // Normalize locations to arrays
  const locsA = getLocations(itemA);
  const locsB = getLocations(itemB);
  if (locsA.length === 0 || locsB.length === 0) return 0;

  const normA = locsA.map(normalize);
  const normB = locsB.map(normalize);

  // Check for any exact match
  const hasMatch = normA.some((a) => normB.includes(a));
  return hasMatch ? 1 : 0;
}

function getLocations(item) {
  const locs = [];
  if (item.locations) locs.push(...item.locations);
  if (item.location) locs.push(item.location);
  return locs.filter(Boolean);
}

/** Date proximity: closer dates score higher, within 14-day window */
function dateScore(itemA, itemB) {
  const dateA = itemA.dateLost || itemA.dateFound || itemA.createdAt;
  const dateB = itemB.dateLost || itemB.dateFound || itemB.createdAt;
  if (!dateA || !dateB) return 0;

  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  const diffDays = Math.abs(msA - msB) / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return 1;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.25;
  return 0;
}

// ─── Weights ────────────────────────────────────────────────────
const WEIGHTS = {
  category: 0.35,
  keywords: 0.30,
  location: 0.20,
  date: 0.15,
};

const MIN_MATCH_SCORE = 0.25;

// ─── Main matching function ─────────────────────────────────────

/**
 * Find matches for a given item against a list of candidate items.
 * Only considers active/matched items of the opposite type.
 *
 * @param {Object} sourceItem - The item to find matches for
 * @param {Array} candidates - Array of items to compare against
 * @returns {Array} Sorted matches with scores and explanations
 */
export function findMatches(sourceItem, candidates) {
  const results = [];

  for (const candidate of candidates) {
    // Skip same item, same user's items, non-active items
    if (candidate.id === sourceItem.id) continue;
    if (![ITEM_STATUSES.ACTIVE, ITEM_STATUSES.MATCHED].includes(candidate.status)) continue;

    // Compute individual scores
    const catScore = categoryScore(sourceItem.category, candidate.category);
    const kwScore = keywordScore(
      `${sourceItem.title} ${sourceItem.description}`,
      `${candidate.title} ${candidate.description}`
    );
    const locScore = locationScore(sourceItem, candidate);
    const dtScore = dateScore(sourceItem, candidate);

    // Weighted total
    const totalScore =
      catScore * WEIGHTS.category +
      kwScore * WEIGHTS.keywords +
      locScore * WEIGHTS.location +
      dtScore * WEIGHTS.date;

    if (totalScore >= MIN_MATCH_SCORE) {
      const reasons = buildReasons(catScore, kwScore, locScore, dtScore, sourceItem, candidate);
      results.push({
        item: candidate,
        score: Math.round(totalScore * 100),
        reasons,
        catScore,
        kwScore,
        locScore,
        dtScore,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

/** Build human-readable explanations for match */
function buildReasons(catScore, kwScore, locScore, dtScore, source, candidate) {
  const reasons = [];

  if (catScore > 0) {
    reasons.push(`Same category: ${candidate.category}`);
  }

  if (kwScore > 0.1) {
    const commonWords = findCommonKeywords(
      `${source.title} ${source.description}`,
      `${candidate.title} ${candidate.description}`
    );
    if (commonWords.length > 0) {
      reasons.push(`Matching keywords: ${commonWords.slice(0, 5).join(', ')}`);
    }
  }

  if (locScore > 0) {
    const locsA = getLocations(source);
    const locsB = getLocations(candidate);
    const common = locsA.filter((a) =>
      locsB.some((b) => normalize(a) === normalize(b))
    );
    if (common.length > 0) {
      reasons.push(`Same location: ${common.join(', ')}`);
    }
  }

  if (dtScore >= 0.8) {
    reasons.push('Reported within a similar timeframe');
  } else if (dtScore >= 0.5) {
    reasons.push('Reported within a week of each other');
  } else if (dtScore > 0) {
    reasons.push('Reported within two weeks of each other');
  }

  return reasons;
}

function findCommonKeywords(textA, textB) {
  const kwA = new Set(extractKeywords(textA));
  const kwB = new Set(extractKeywords(textB));
  return [...kwA].filter((w) => kwB.has(w));
}

/**
 * Run matching for all active lost items against all active found items.
 * Useful for the Smart Matching page.
 */
export function findAllMatches(lostItems, foundItems) {
  const allMatches = [];

  for (const lostItem of lostItems) {
    if (![ITEM_STATUSES.ACTIVE, ITEM_STATUSES.MATCHED].includes(lostItem.status)) continue;
    const matches = findMatches(lostItem, foundItems);
    if (matches.length > 0) {
      allMatches.push({
        lostItem,
        matches,
      });
    }
  }

  // Also check found items against lost items
  for (const foundItem of foundItems) {
    if (![ITEM_STATUSES.ACTIVE, ITEM_STATUSES.MATCHED].includes(foundItem.status)) continue;
    // Skip if already covered from lost side
    const alreadyCovered = allMatches.some((m) =>
      m.matches.some((match) => match.item.id === foundItem.id)
    );
    if (alreadyCovered) continue;

    const matches = findMatches(foundItem, lostItems);
    if (matches.length > 0) {
      allMatches.push({
        lostItem: foundItem, // source item (could be found)
        matches,
      });
    }
  }

  return allMatches;
}
