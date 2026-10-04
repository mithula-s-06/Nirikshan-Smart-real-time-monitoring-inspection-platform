import crypto from 'crypto';

/**
 * Text Normalization for Indian Names and Addresses
 * - Lowercase and trim
 * - Removes honorific titles (Shri, Smt, Mr, Mrs, Kumari, Dr, Master, etc.)
 * - Strips punctuation and special characters
 * - Folds phonetic variants (aa->a, ee->i, oo->u, w->v, ph->f, dh->d, th->t, kh->k, etc.)
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text.toLowerCase().trim();

  // Strip common Indian titles / honorifics
  const titles = [
    /\b(shri|shree|smt|shrimati|kumari|km|mr|mrs|miss|master|dr|prof|late|baby|adv)\b\.?/gi,
    /\b(c\/o|s\/o|d\/o|w\/o|care of|son of|daughter of|wife of)\b/gi
  ];
  for (const t of titles) {
    str = str.replace(t, ' ');
  }

  // Strip punctuation and excess whitespace
  str = str.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Phonetic variant folding
  str = str
    .replace(/aa+/g, 'a')
    .replace(/ee+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/sh/g, 's')
    .replace(/zh/g, 'z')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/bh/g, 'b');

  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Jaro-Winkler Similarity between two strings (0.0 to 1.0)
 */
export function jaroWinklerSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;

  // Winkler prefix scaling (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Token-based Jaccard similarity for multi-word fields like addresses or names
 */
export function tokenJaccardSimilarity(s1, s2) {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  const tokens1 = new Set(norm1.split(' ').filter(Boolean));
  const tokens2 = new Set(norm2.split(' ').filter(Boolean));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }
  const union = new Set([...tokens1, ...tokens2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Normalizes and validates Indian 10-digit mobile numbers
 * Returns { valid: boolean, normalized: string, masked: string, hash: string, isPlaceholder: boolean }
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string' && typeof rawPhone !== 'number') {
    return { valid: false, normalized: null, masked: null, hash: null, isPlaceholder: false, raw: rawPhone };
  }

  const str = String(rawPhone).replace(/[^0-9]/g, '');
  let normalized = str;

  // Handle +91 or leading 0
  if (normalized.startsWith('91') && normalized.length === 12) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.substring(1);
  }

  // Placeholder / Invalid check (e.g. 0000000000, 1234567890, 9999999999, 1111111111)
  const isAllSameDigit = /^(\d)\1{9}$/.test(normalized);
  const isSequential = normalized === '1234567890' || normalized === '9876543210' || normalized === '0123456789';
  const isPlaceholder = isAllSameDigit || isSequential;

  const isIndianMobile = /^[6-9]\d{9}$/.test(normalized);
  const valid = isIndianMobile && !isPlaceholder;

  let masked = null;
  let hash = null;

  if (normalized.length >= 4) {
    masked = normalized.substring(0, 2) + '******' + normalized.substring(normalized.length - 2);
    hash = crypto.createHmac('sha256', 'scheme-privacy-salt-key').update(normalized).digest('hex').substring(0, 16);
  }

  return {
    valid,
    normalized,
    masked,
    hash,
    isPlaceholder: isPlaceholder || (!isIndianMobile && normalized.length === 10),
    raw: rawPhone
  };
}

/**
 * Date Normalization to ISO string YYYY-MM-DD
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return null;
  if (rawDate instanceof Date) {
    return !isNaN(rawDate.getTime()) ? rawDate.toISOString().split('T')[0] : null;
  }
  const str = String(rawDate).trim();
  // Check DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Calculates age in years at a given reference date
 */
export function calculateAge(dobStr, refDateStr = new Date().toISOString()) {
  const dob = new Date(dobStr);
  const ref = new Date(refDateStr);
  if (isNaN(dob.getTime()) || isNaN(ref.getTime())) return null;

  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Difference in calendar days between two ISO date strings (date2 - date1)
 */
export function daysBetween(date1Str, date2Str) {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Chi-Square Goodness of Fit & Total Variation Distance (TVD)
 * Compares current category counts with baseline proportions
 */
export function calculateDistributionMetrics(observedCounts, baselineProportions) {
  const categories = Object.keys(baselineProportions);
  const totalObserved = Object.values(observedCounts).reduce((a, b) => a + b, 0);

  if (totalObserved === 0 || categories.length === 0) {
    return { chiSquare: 0, pValue: 1.0, tvd: 0, shifts: [] };
  }

  let chiSquare = 0;
  let tvdSum = 0;
  const shifts = [];

  for (const cat of categories) {
    const obs = observedCounts[cat] || 0;
    const baseProp = baselineProportions[cat] || 0.0001;
    const exp = totalObserved * baseProp;

    const obsProp = obs / totalObserved;
    const shiftPercent = (obsProp - baseProp) * 100;

    shifts.push({
      category: cat,
      observedCount: obs,
      observedProp: Number(obsProp.toFixed(3)),
      baselineProp: Number(baseProp.toFixed(3)),
      shiftPoints: Number(shiftPercent.toFixed(1))
    });

    if (exp > 0) {
      chiSquare += Math.pow(obs - exp, 2) / exp;
    }
    tvdSum += Math.abs(obsProp - baseProp);
  }

  // Total Variation Distance is 0.5 * sum(|p_i - q_i|)
  const tvd = Number((0.5 * tvdSum).toFixed(3));

  // Sort shifts by magnitude
  shifts.sort((a, b) => Math.abs(b.shiftPoints) - Math.abs(a.shiftPoints));

  return {
    chiSquare: Number(chiSquare.toFixed(2)),
    tvd,
    totalObserved,
    shifts
  };
}
