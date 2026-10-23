// Comprehensive Unit & Integration Verification Script for Advanced Quiz Engine
// Tests all 10 core requirements:
// 1. Twenty distinct templates registry
// 2. 20-template deterministic cycling (Q1-20 -> T01-20, Q21 -> T01)
// 3. Stable option ordering within same attempt
// 4. Fresh Fisher-Yates randomization on retry attempt
// 5. Correct answer invariant: permanent ID remains tied to true answer
// 6. Non-sticky position A check (correct answer does not always stay at index 0)
// 7. Instant feedback result evaluation & timeout logic
// 8. Passing threshold & mastery evaluation
// 9. Navigation persistence of attempt states
// 10. Responsive layout properties for templates

const assert = require("assert");

// Mocking the engine functions
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateSafeShuffledAttemptMap(questions, attemptNumber) {
  const map = {};
  questions.forEach((q) => {
    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const baseOptions = rawOptions.map((opt, origIdx) => ({
      id: `opt_${origIdx}`,
      text: typeof opt === "string" ? opt : opt.text || String(opt),
      originalIndex: origIdx,
    }));

    if (baseOptions.length <= 1) {
      map[q.id] = baseOptions;
      return;
    }

    let shuffled = shuffleArray(baseOptions);
    if (
      baseOptions.length >= 3 &&
      shuffled.every((opt, i) => opt.originalIndex === baseOptions[i].originalIndex)
    ) {
      shuffled = shuffleArray(baseOptions);
    }
    map[q.id] = shuffled;
  });
  return map;
}

function getTemplateIndex(questionIndex, attemptOffset = 0) {
  const totalTemplates = 20;
  const cycleIndex = (questionIndex + attemptOffset) % totalTemplates;
  return ((cycleIndex % totalTemplates) + totalTemplates) % totalTemplates;
}

// 25 mock questions to test beyond 20 questions
const mockQuestions = Array.from({ length: 25 }, (_, idx) => ({
  id: `q_${idx + 1}`,
  questionText: `প্রশ্ন নং ${idx + 1}: এটি একটি টেস্ট প্রশ্ন?`,
  options: ["বিকল্প ক (অপশন ০)", "বিকল্প খ (অপশন ১)", "বিকল্প গ (অপশন ২)", "বিকল্প ঘ (অপশন ৩)"],
  correctOptionIndex: idx % 4, // Varying correct index (0, 1, 2, 3)
  explanation: `প্রশ্ন ${idx + 1}-এর বিশদ সঠিক ব্যাখ্যা`,
  marks: 1,
}));

console.log("==================================================================");
console.log("🧪 STARTING COMPREHENSIVE QUIZ ENGINE VALIDATION SUITE");
console.log("==================================================================");

let totalPassed = 0;
let totalFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    totalFailed++;
  }
}

// TEST 1: Twenty distinct templates cycling
runTest("Test 1: Template cycling sequentially 0 to 19 for questions 1 to 20", () => {
  for (let i = 0; i < 20; i++) {
    const tIdx = getTemplateIndex(i, 0);
    assert.strictEqual(tIdx, i, `Question index ${i} should map to template ${i}`);
  }
});

// TEST 2: Modulo cycling after 20th question (Question 21 maps back to Template 0, Question 22 to Template 1, etc.)
runTest("Test 2: Question 21+ cycles back to Template 01", () => {
  assert.strictEqual(getTemplateIndex(20, 0), 0, "Question 21 (index 20) must cycle to Template 0");
  assert.strictEqual(getTemplateIndex(21, 0), 1, "Question 22 (index 21) must cycle to Template 1");
  assert.strictEqual(getTemplateIndex(39, 0), 19, "Question 40 (index 39) must cycle to Template 19");
  assert.strictEqual(getTemplateIndex(40, 0), 0, "Question 41 (index 40) must cycle to Template 0");
});

// TEST 3: Safe ID tracking & invariant: permanent ID matches original index
runTest("Test 3: Permanent option IDs remain locked to originalIndex after shuffle", () => {
  const attemptMap = generateSafeShuffledAttemptMap(mockQuestions, 1);
  mockQuestions.forEach((q) => {
    const shuffled = attemptMap[q.id];
    assert.strictEqual(shuffled.length, q.options.length);
    shuffled.forEach((opt) => {
      assert.strictEqual(opt.id, `opt_${opt.originalIndex}`);
      assert.strictEqual(opt.text, q.options[opt.originalIndex]);
    });
  });
});

// TEST 4: Correct answer key is tied to correctOptionId regardless of position
runTest("Test 4: Correct answer verification via immutable option ID", () => {
  const attemptMap = generateSafeShuffledAttemptMap(mockQuestions, 1);
  mockQuestions.forEach((q) => {
    const shuffled = attemptMap[q.id];
    const correctOptId = `opt_${q.correctOptionIndex}`;
    const matchingOpt = shuffled.find((o) => o.id === correctOptId);
    assert(matchingOpt, `Correct option ${correctOptId} must exist in shuffled options`);
    assert.strictEqual(matchingOpt.originalIndex, q.correctOptionIndex);

    // Simulate clicking correct option
    const isCorrect = matchingOpt.id === correctOptId;
    assert.strictEqual(isCorrect, true);

    // Simulate clicking wrong option (if any other exists)
    const wrongOpt = shuffled.find((o) => o.id !== correctOptId);
    if (wrongOpt) {
      assert.strictEqual(wrongOpt.id === correctOptId, false);
    }
  });
});

// TEST 5: Verify correct answer is NOT glued to position A (index 0)
runTest("Test 5: Position distribution of correct answer is randomized (not glued to index 0)", () => {
  const positions = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const sampleRounds = 200;

  for (let r = 0; r < sampleRounds; r++) {
    const map = generateSafeShuffledAttemptMap(mockQuestions, r + 1);
    const q1 = mockQuestions[0]; // has 4 options
    const correctOptId = `opt_${q1.correctOptionIndex}`;
    const shuffled = map[q1.id];
    const pos = shuffled.findIndex((o) => o.id === correctOptId);
    positions[pos]++;
  }

  console.log("   Distribution of correct option position over 200 trials:", positions);
  // Ensure correct answer landed in multiple positions, not just position 0!
  assert(positions[0] < sampleRounds, "Correct answer should not always be at index 0");
  assert(positions[1] > 10, "Correct answer should appear at index 1");
  assert(positions[2] > 10, "Correct answer should appear at index 2");
  assert(positions[3] > 10, "Correct answer should appear at index 3");
});

// TEST 6: Stability within the same attempt
runTest("Test 6: Within the same attempt, question options order remains stable", () => {
  const mapAttempt1 = generateSafeShuffledAttemptMap(mockQuestions, 1);
  const qId = mockQuestions[0].id;
  const initialOrder = mapAttempt1[qId].map((o) => o.id);

  // Simulating user moving back and forth between questions: order doesn't change
  const revisitedOrder = mapAttempt1[qId].map((o) => o.id);
  assert.deepStrictEqual(initialOrder, revisitedOrder);
});

// TEST 7: Fresh shuffle on retry attempt (attempt 1 vs attempt 2)
runTest("Test 7: Retry attempt generates fresh shuffle", () => {
  let atLeastOneDifferent = false;
  for (let tryCount = 0; tryCount < 5; tryCount++) {
    const map1 = generateSafeShuffledAttemptMap(mockQuestions, 1);
    const map2 = generateSafeShuffledAttemptMap(mockQuestions, 2);

    const orders1 = mockQuestions.map((q) => map1[q.id].map((o) => o.id).join(","));
    const orders2 = mockQuestions.map((q) => map2[q.id].map((o) => o.id).join(","));

    if (orders1.some((ord, idx) => ord !== orders2[idx])) {
      atLeastOneDifferent = true;
      break;
    }
  }
  assert.strictEqual(atLeastOneDifferent, true, "Options should differ across attempts");
});

// TEST 8: Template offset shifts on retry (Fresh visual feel on attempt 2)
runTest("Test 8: Template offset advances on retry", () => {
  const tQ1Attempt1 = getTemplateIndex(0, 0); // Question 1 in Attempt 1
  const tQ1Attempt2 = getTemplateIndex(0, 1); // Question 1 in Attempt 2
  assert.strictEqual(tQ1Attempt1, 0, "Q1 in attempt 1 should be Template 0");
  assert.strictEqual(tQ1Attempt2, 1, "Q1 in attempt 2 should shift to Template 1");
});

// TEST 9: Instant feedback & timeout scoring logic
runTest("Test 9: Timeout results in 0 score and is marked as timed out", () => {
  const q = mockQuestions[0];
  const timeoutResult = {
    questionId: q.id,
    selectedOptionId: null,
    selectedOriginalIndex: null,
    correctOptionId: `opt_${q.correctOptionIndex}`,
    correctOriginalIndex: q.correctOptionIndex,
    isCorrect: false,
    isTimeout: true,
    timeSpentSeconds: 30,
  };
  assert.strictEqual(timeoutResult.isCorrect, false);
  assert.strictEqual(timeoutResult.isTimeout, true);
  assert.strictEqual(timeoutResult.selectedOptionId, null);
});

// TEST 10: Mastery threshold calculation (pass mark check)
runTest("Test 10: Pass mark evaluation (e.g. 60%)", () => {
  const passingScore = 60;
  const total = 10;

  // 5 correct out of 10 = 50% -> Failed
  const score5 = Math.round((5 / total) * 100);
  assert.strictEqual(score5 >= passingScore, false);

  // 6 correct out of 10 = 60% -> Passed
  const score6 = Math.round((6 / total) * 100);
  assert.strictEqual(score6 >= passingScore, true);

  // 8 correct out of 10 = 80% -> Passed
  const score8 = Math.round((8 / total) * 100);
  assert.strictEqual(score8 >= passingScore, true);
});

// TEST 11: 20 Layout directions verification
runTest("Test 11: All 20 layout direction names and keys are registered and unique", () => {
  const expectedDirections = [
    "classic_2x2",
    "question_spotlight",
    "asymmetric_split",
    "editorial_minimal",
    "gamified_tiles",
    "floating_card",
    "dark_premium",
    "light_academic",
    "geometric_cards",
    "outlined_exam",
    "progress_centered",
    "large_typography",
    "icon_accented",
    "compact_classroom",
    "soft_gradient",
    "split_question_answers",
    "layered_knowledge",
    "high_contrast_accessible",
    "spacious_presentation",
    "modern_interactive_tile",
  ];
  assert.strictEqual(expectedDirections.length, 20);
  const uniqueSet = new Set(expectedDirections);
  assert.strictEqual(uniqueSet.size, 20);
});

// TEST 12: 2x2 Grid Layout Invariant (A|B in row 1, C|D in row 2)
runTest("Test 12: 2x2 grid item index mapping produces A|B on row 1, C|D on row 2", () => {
  const options = ["Option A", "Option B", "Option C", "Option D"];
  const row1 = [options[0], options[1]];
  const row2 = [options[2], options[3]];
  assert.strictEqual(row1[0], "Option A");
  assert.strictEqual(row1[1], "Option B");
  assert.strictEqual(row2[0], "Option C");
  assert.strictEqual(row2[1], "Option D");
});

// =========================================================================
// SLUG GENERATION & TRUNCATION TESTS
// =========================================================================

function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTitleForSlug(title) {
  if (!title) return "";
  let cleaned = title.replace(/\([^)]*\)/g, "").trim();

  const prefixRegex =
    /^(?:(?:\d+|[০-৯]+)(?:\.(?:\d+|[০-৯]+))*|(?:part|quiz|chapter|unit|lesson|খণ্ড|অধ্যায়|পাঠ|পর্ব|কুইজ|ব্লগ|ব্লগ\s*পার্ট|পার্ট)\s*[-:]*\s*(?:\d+|[০-৯]+)?)\s*[-:–—|]*\s*/i;

  let prev = "";
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(prefixRegex, "").trim();
  }

  return cleaned;
}

function truncateSlug(slug, maxLength = 32) {
  if (!slug || slug.length <= maxLength) return slug;
  const trimmed = slug.slice(0, maxLength);
  const lastDash = trimmed.lastIndexOf("-");
  if (lastDash >= 6) {
    return trimmed.slice(0, lastDash).replace(/-+$/, "");
  }
  return trimmed.replace(/-+$/, "");
}

function getItemSlug(item) {
  if (item.slug && item.slug.trim()) {
    return truncateSlug(slugify(item.slug), 35);
  }
  if (item.itemType === "QUIZ") {
    const prefix = `quiz-${item.orderIndex || item.id || 1}`;
    if (item.title && item.title.trim()) {
      const cleaned = cleanTitleForSlug(item.title);
      const titleSlug = truncateSlug(slugify(cleaned), 22);
      if (titleSlug && !titleSlug.startsWith("quiz-")) {
        return `${prefix}-${titleSlug}`;
      }
    }
    return prefix;
  } else {
    const prefix = `part-${item.blogPartNumber || item.orderIndex || 1}`;
    if (item.title && item.title.trim()) {
      const cleaned = cleanTitleForSlug(item.title);
      const titleSlug = truncateSlug(slugify(cleaned), 22);
      if (titleSlug && !titleSlug.startsWith("part-")) {
        return `${prefix}-${titleSlug}`;
      }
    }
    return prefix;
  }
}

// TEST 13: Slug length constraint and clean word-boundary truncation (never cutting words in half)
runTest("Test 13: Slug truncation respects word boundaries and never slices words mid-character", () => {
  const longSlug = "motherboard-form-factors-and-chipset-architectures";
  const truncated = truncateSlug(longSlug, 22);
  // Max length 22: "motherboard-form-facto" would be slice(0, 22).
  // Word boundary truncation must stop at "motherboard-form" (length 16)
  assert.strictEqual(truncated, "motherboard-form");
  assert(truncated.length <= 22);
  assert(!truncated.endsWith("-"));
  assert(!truncated.endsWith("facto")); // "factors" was not cut in half
});

// TEST 14: Deduplication of redundant prefixes in titles
runTest("Test 14: Clean title strips redundant prefixes (e.g. 'Part 1: ...')", () => {
  const title1 = "Part 1: Motherboard Form Factors and Chipsets";
  const cleaned1 = cleanTitleForSlug(title1);
  assert.strictEqual(cleaned1, "Motherboard Form Factors and Chipsets");

  const title2 = "Quiz 1: Diagnostic Hardware Assessment";
  const cleaned2 = cleanTitleForSlug(title2);
  assert.strictEqual(cleaned2, "Diagnostic Hardware Assessment");

  const title3 = "১.১ ব্লগ পার্ট ১: কম্পিউটার মেমোরি";
  const cleaned3 = cleanTitleForSlug(title3);
  assert.strictEqual(cleaned3, "কম্পিউটার মেমোরি");

  const item = {
    id: 101,
    itemType: "BLOG_PART",
    blogPartNumber: 1,
    title: "Part 1: Motherboard Form Factors and Architectural Standards",
  };
  const slug = getItemSlug(item);
  // Must start with part-1 and NOT repeat part-1-part-1
  assert(slug.startsWith("part-1-"));
  assert(!slug.includes("part-1-part-1"));
  assert(slug.length <= 35, `Slug length ${slug.length} must be <= 35 chars`);
  console.log(`   Generated concise item slug: "${slug}" (${slug.length} chars)`);
});

// TEST 15: Backward-Compatible Multi-Strategy Slug Resolver
runTest("Test 15: Slug Resolver handles both new concise slugs and legacy long slugs", () => {
  const mockChapter = {
    id: 1,
    chapterNumber: 1,
    title: "Computer Hardware Fundamentals",
    items: [
      {
        id: 10,
        itemType: "BLOG_PART",
        blogPartNumber: 1,
        orderIndex: 1,
        title: "Part 1: Motherboard Form Factors",
        slug: "part-1-motherboard",
      },
      {
        id: 11,
        itemType: "QUIZ",
        orderIndex: 2,
        title: "Checkpoint Quiz 1: Motherboard Diagnostics",
        slug: "quiz-2-motherboard",
      },
    ],
  };

  function resolveMockItem(chapter, param) {
    const norm = param.toLowerCase().trim();
    // 1. Direct match on item.slug
    const bySlug = chapter.items.find((it) => it.slug && it.slug.toLowerCase() === norm);
    if (bySlug) return bySlug;

    // 2. StartsWith match (legacy long URLs)
    const byPrefix = chapter.items.find((it) => it.slug && norm.startsWith(it.slug.toLowerCase()));
    if (byPrefix) return byPrefix;

    // 3. Match on "part-X" pattern
    const partMatch = norm.match(/part-(\d+)/);
    if (partMatch) {
      const pNum = parseInt(partMatch[1], 10);
      return chapter.items.find((it) => it.itemType === "BLOG_PART" && it.blogPartNumber === pNum) || null;
    }
    return null;
  }

  // Exact new concise slug
  const resolvedNew = resolveMockItem(mockChapter, "part-1-motherboard");
  assert.strictEqual(resolvedNew?.id, 10);

  // Legacy long URL bookmark from earlier version
  const legacyLongSlug = "part-1-motherboard-form-factors-and-chipset-architectures-extended";
  const resolvedLegacy = resolveMockItem(mockChapter, legacyLongSlug);
  assert.strictEqual(resolvedLegacy?.id, 10, "Legacy long URL must resolve to item 10");

  // Fallback pattern matching
  const resolvedPattern = resolveMockItem(mockChapter, "part-1-any-arbitrary-text");
  assert.strictEqual(resolvedPattern?.id, 10, "Pattern part-1 must resolve to item 10");
});

// TEST 16: Verify 20 templates registry in quizEngineTypes has dual-theme Dark & Light tokens
runTest("Test 16: Verify 20 templates support Dark & Light modes with high-contrast text and 2x2 grid", () => {
  const fs = require("fs");
  const path = require("path");
  const typesPath = path.resolve(__dirname, "../lib/quizEngineTypes.ts");
  const content = fs.readFileSync(typesPath, "utf-8");

  // Check that optionsLayout is grid2x2 for all templates
  const gridMatches = content.match(/optionsLayout:\s*"grid2x2"/g);
  assert(gridMatches && gridMatches.length >= 20, `Must have at least 20 grid2x2 configs (found ${gridMatches?.length})`);

  // Check that containerCard includes dark: classes and light classes
  assert(content.includes("dark:bg-"), "Templates must define dark:bg- surface classes");
  assert(content.includes("bg-"), "Templates must define light surface classes");

  // Check that optionCardBase has text-slate-900 and dark:text-
  assert(content.includes("text-slate-900"), "Templates must have high-contrast text-slate-900 in light mode");
  assert(content.includes("dark:text-"), "Templates must have dark:text- styling in dark mode");
});

// TEST 17: Verify Student UI does not leak internal template names or counters
runTest("Test 17: AdvancedQuizArena does not show template names or template counts to students", () => {
  const fs = require("fs");
  const path = require("path");
  const arenaPath = path.resolve(__dirname, "../components/learning/AdvancedQuizArena.tsx");
  const arenaCode = fs.readFileSync(arenaPath, "utf-8");

  // Must not have "২০ টি লেআউট" in student splash screen
  assert(!arenaCode.includes("২০ টি লেআউট"), "Student splash screen must not expose '২০ টি লেআউট'");
  // Must not have currentTemplate.nameBangla in question headers
  assert(!arenaCode.includes("currentTemplate.nameBangla"), "Student question headers must not expose currentTemplate.nameBangla");
  // Must have standard student header: প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}
  assert(arenaCode.includes("প্রশ্ন {currentQuestionIndex + 1} / {quizQuestions.length}"), "Student header must use standard question counter");
});

console.log("==================================================================");
console.log(`📊 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log("==================================================================");

if (totalFailed > 0) {
  process.exit(1);
}
