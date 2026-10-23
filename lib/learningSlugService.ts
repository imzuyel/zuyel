// SEO-Friendly Learning Pathway Slug Service for PTSC ERP
// Provides clean, concise, URL-safe slug generation, URL builders, and resilient multi-strategy slug resolvers.
// Route Schema: /learning/[class]/[subject]/[chapter]/[slug]

import { CourseItem, CourseChapterItem, ChapterContentItemData } from "@/lib/chapterLearningEngine";

/**
 * Clean URL-safe ASCII slug generator
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace accented characters
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Replace non-alphanumeric chars (except dash) with dash
    .replace(/[^a-z0-9\s-]/g, "")
    // Replace spaces and multiple dashes with single dash
    .replace(/[\s-]+/g, "-")
    // Remove leading and trailing dashes
    .replace(/^-+|-+$/g, "");
}

/**
 * Strips redundant prefixes and parenthetical content from titles before slugifying.
 * E.g. "Part 1: Motherboard Form Factors" -> "Motherboard Form Factors"
 * E.g. "Quiz 1: Diagnostic Assessment" -> "Diagnostic Assessment"
 * E.g. "Chapter 1: Basic Electronics" -> "Basic Electronics"
 * E.g. "১.১ ব্লগ পার্ট ১: মাদারবোর্ড" -> "মাদারবোর্ড"
 */
export function cleanTitleForSlug(title: string): string {
  if (!title) return "";
  let cleaned = title.replace(/\([^)]*\)/g, "").trim();

  // Repeatedly strip leading numbers, "part X", "quiz X", "অধ্যায় X", "ব্লগ পার্ট X", etc.
  const prefixRegex =
    /^(?:(?:\d+|[০-৯]+)(?:\.(?:\d+|[০-৯]+))*|(?:part|quiz|chapter|unit|lesson|খণ্ড|অধ্যায়|পাঠ|পর্ব|কুইজ|ব্লগ|ব্লগ\s*পার্ট|পার্ট)\s*[-:]*\s*(?:\d+|[০-৯]+)?)\s*[-:–—|]*\s*/i;

  let prev = "";
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(prefixRegex, "").trim();
  }

  return cleaned;
}

/**
 * Truncates a slug cleanly on a word (hyphen) boundary without slicing words in half.
 * @param slug The raw slug
 * @param maxLength Maximum length limit (default: 32)
 */
export function truncateSlug(slug: string, maxLength: number = 32): string {
  if (!slug || slug.length <= maxLength) return slug;
  const trimmed = slug.slice(0, maxLength);
  const lastDash = trimmed.lastIndexOf("-");
  // If there's a hyphen after index 6, slice at the hyphen to avoid broken words
  if (lastDash >= 6) {
    return trimmed.slice(0, lastDash).replace(/-+$/, "");
  }
  return trimmed.replace(/-+$/, "");
}

/**
 * Standardize Class slug (e.g. 9 -> "class-9", "class-9" -> "class-9")
 */
export function getClassSlug(numericClass: number | string): string {
  const num = typeof numericClass === "number" ? numericClass : parseInt(String(numericClass).replace(/\D/g, ""), 10);
  if (!isNaN(num) && num > 0) {
    return `class-${num}`;
  }
  return "class-all";
}

/**
 * Parse numeric class from slug parameter (e.g. "class-9" -> 9, "9" -> 9)
 */
export function parseNumericClass(classSlug: string): number | null {
  if (!classSlug || classSlug === "all" || classSlug === "class-all") return null;
  const match = classSlug.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Standardize Course / Subject slug (Concise, max 30 chars)
 */
export function getCourseSlug(course: Partial<CourseItem>): string {
  if (course.slug && course.slug.trim()) {
    return truncateSlug(slugify(course.slug), 35);
  }
  // Try course code (clean, short and standard, e.g. "it-iot-201")
  if (course.code && course.code.trim()) {
    const codeSlug = slugify(course.code);
    if (codeSlug) return truncateSlug(codeSlug, 30);
  }
  if (course.title && course.title.trim()) {
    const cleaned = cleanTitleForSlug(course.title);
    const titleSlug = slugify(cleaned);
    if (titleSlug) return truncateSlug(titleSlug, 30);
  }
  return `course-${course.id || "subject"}`;
}

/**
 * Standardize Chapter slug (Concise: e.g. "chapter-1-motherboard", max 32 chars)
 */
export function getChapterSlug(chapter: Partial<CourseChapterItem>): string {
  if (chapter.slug && chapter.slug.trim()) {
    return truncateSlug(slugify(chapter.slug), 35);
  }
  const prefix = `chapter-${chapter.chapterNumber || chapter.id || 1}`;
  if (chapter.title && chapter.title.trim()) {
    const cleaned = cleanTitleForSlug(chapter.title);
    const titleSlug = truncateSlug(slugify(cleaned), 22);
    if (titleSlug && !titleSlug.startsWith(prefix)) {
      return `${prefix}-${titleSlug}`;
    }
  }
  return prefix;
}

/**
 * Standardize Content Item (Lesson / Blog / Quiz) slug (Concise: e.g. "part-1-motherboard", max 32 chars)
 */
export function getItemSlug(item: Partial<ChapterContentItemData>): string {
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

/**
 * Build URL for Subject Overview & Chapter List Page
 * /learning/[class]/[subject]
 */
export function buildSubjectUrl(course: CourseItem): string {
  const classSlug = getClassSlug(course.numericClass || course.classId);
  const subjectSlug = getCourseSlug(course);
  return `/learning/${classSlug}/${subjectSlug}`;
}

/**
 * Build URL for Chapter Learning Pathway Roadmap Page
 * /learning/[class]/[subject]/[chapter]
 */
export function buildChapterUrl(course: CourseItem, chapter: CourseChapterItem): string {
  const classSlug = getClassSlug(course.numericClass || course.classId);
  const subjectSlug = getCourseSlug(course);
  const chapterSlug = getChapterSlug(chapter);
  return `/learning/${classSlug}/${subjectSlug}/${chapterSlug}`;
}

/**
 * Build URL for Dedicated Lesson View (Blog Part or Quiz)
 * /learning/[class]/[subject]/[chapter]/[slug]
 */
export function buildLessonUrl(
  course: CourseItem,
  chapter: CourseChapterItem,
  item: ChapterContentItemData
): string {
  const classSlug = getClassSlug(course.numericClass || course.classId);
  const subjectSlug = getCourseSlug(course);
  const chapterSlug = getChapterSlug(chapter);
  const itemSlug = getItemSlug(item);
  return `/learning/${classSlug}/${subjectSlug}/${chapterSlug}/${itemSlug}`;
}

/**
 * Multi-strategy course resolver from URL parameters (Resilient & Backward-Compatible)
 */
export function resolveCourse(
  classParam: string,
  subjectParam: string,
  courses: CourseItem[]
): CourseItem | null {
  if (!subjectParam || !courses.length) return null;
  const numericClass = parseNumericClass(classParam);
  const normalizedSubject = subjectParam.toLowerCase().trim();

  // Filter candidates by class if class is specified
  const candidates = numericClass !== null
    ? courses.filter((c) => c.numericClass === numericClass || c.classId === numericClass)
    : courses;

  // 1. Direct match on course.slug
  const bySlug = candidates.find((c) => c.slug && c.slug.toLowerCase() === normalizedSubject);
  if (bySlug) return bySlug;

  // 2. Match on generated course slug
  const byGenSlug = candidates.find((c) => getCourseSlug(c) === normalizedSubject);
  if (byGenSlug) return byGenSlug;

  // 3. Match on code
  const byCode = candidates.find(
    (c) => c.code && (c.code.toLowerCase() === normalizedSubject || slugify(c.code) === normalizedSubject)
  );
  if (byCode) return byCode;

  // 4. StartsWith or Prefix Match (handles old longer slugs)
  const byPrefix = candidates.find((c) => {
    const gen = getCourseSlug(c);
    return normalizedSubject.startsWith(gen) || (c.slug && normalizedSubject.startsWith(c.slug.toLowerCase()));
  });
  if (byPrefix) return byPrefix;

  // 5. Match on title slug
  const byTitle = candidates.find((c) => c.title && slugify(c.title).startsWith(normalizedSubject));
  if (byTitle) return byTitle;

  // 6. Numeric ID fallback
  const numId = parseInt(normalizedSubject, 10);
  if (!isNaN(numId)) {
    const byId = candidates.find((c) => c.id === numId);
    if (byId) return byId;
  }

  // 7. If not found in class-filtered candidates, search across all courses
  if (candidates.length < courses.length) {
    return resolveCourse("all", subjectParam, courses);
  }

  return null;
}

/**
 * Multi-strategy chapter resolver from course and chapter parameter (Resilient & Backward-Compatible)
 */
export function resolveChapter(course: CourseItem, chapterParam: string): CourseChapterItem | null {
  if (!course?.chapters || !chapterParam) return null;
  const normalized = chapterParam.toLowerCase().trim();

  // 1. Direct match on chapter.slug
  const bySlug = course.chapters.find((ch) => ch.slug && ch.slug.toLowerCase() === normalized);
  if (bySlug) return bySlug;

  // 2. Match on generated chapter slug
  const byGenSlug = course.chapters.find((ch) => getChapterSlug(ch) === normalized);
  if (byGenSlug) return byGenSlug;

  // 3. StartsWith match (handles legacy long chapter slugs)
  const byPrefix = course.chapters.find((ch) => {
    const gen = getChapterSlug(ch);
    return normalized.startsWith(gen) || (ch.slug && normalized.startsWith(ch.slug.toLowerCase()));
  });
  if (byPrefix) return byPrefix;

  // 4. Match on "chapter-X" pattern
  const chapterNumMatch = normalized.match(/chapter-(\d+)/);
  if (chapterNumMatch) {
    const chNum = parseInt(chapterNumMatch[1], 10);
    const byNum = course.chapters.find((ch) => ch.chapterNumber === chNum);
    if (byNum) return byNum;
  }

  // 5. Match on title slug
  const byTitle = course.chapters.find((ch) => ch.title && slugify(ch.title).startsWith(normalized));
  if (byTitle) return byTitle;

  // 6. Numeric ID fallback
  const numId = parseInt(normalized, 10);
  if (!isNaN(numId)) {
    const byId = course.chapters.find((ch) => ch.id === numId);
    if (byId) return byId;
  }

  return null;
}

/**
 * Multi-strategy content item resolver (Resilient & Backward-Compatible)
 */
export function resolveItem(chapter: CourseChapterItem, itemParam: string): ChapterContentItemData | null {
  if (!chapter?.items || !itemParam) return null;
  const normalized = itemParam.toLowerCase().trim();

  // 1. Direct match on item.slug
  const bySlug = chapter.items.find((it) => it.slug && it.slug.toLowerCase() === normalized);
  if (bySlug) return bySlug;

  // 2. Match on generated item slug
  const byGenSlug = chapter.items.find((it) => getItemSlug(it) === normalized);
  if (byGenSlug) return byGenSlug;

  // 3. StartsWith match (handles legacy long slugs, e.g. "part-1-part-1-motherboard...")
  const byPrefix = chapter.items.find((it) => {
    const gen = getItemSlug(it);
    return normalized.startsWith(gen) || (it.slug && normalized.startsWith(it.slug.toLowerCase()));
  });
  if (byPrefix) return byPrefix;

  // 4. Match on "part-X" pattern
  const partNumMatch = normalized.match(/part-(\d+)/);
  if (partNumMatch) {
    const partNum = parseInt(partNumMatch[1], 10);
    const byPart = chapter.items.find(
      (it) => it.itemType === "BLOG_PART" && (it.blogPartNumber === partNum || it.orderIndex === partNum)
    );
    if (byPart) return byPart;
  }

  // 5. Match on "quiz-X" pattern
  const quizNumMatch = normalized.match(/quiz-(\d+)/);
  if (quizNumMatch) {
    const quizNum = parseInt(quizNumMatch[1], 10);
    const byQuiz = chapter.items.find((it) => it.itemType === "QUIZ" && it.orderIndex === quizNum);
    if (byQuiz) return byQuiz;
  }

  // 6. Match if quiz is simply "quiz", "exam", or "final-quiz"
  if (normalized === "quiz" || normalized === "exam" || normalized === "final-quiz") {
    const firstQuiz = chapter.items.find((it) => it.itemType === "QUIZ");
    if (firstQuiz) return firstQuiz;
  }

  // 7. Match on title slug
  const byTitle = chapter.items.find((it) => it.title && slugify(it.title).startsWith(normalized));
  if (byTitle) return byTitle;

  // 8. Numeric ID fallback
  const numId = parseInt(normalized, 10);
  if (!isNaN(numId)) {
    const byId = chapter.items.find((it) => it.id === numId);
    if (byId) return byId;
  }

  return null;
}
