"use client";

import React, { use } from "react";
import SplitScreenChapterLearningView from "@/components/learning/SplitScreenChapterLearningView";

interface LessonSlugPageProps {
  params: Promise<{
    class: string;
    subject: string;
    chapter: string;
    slug: string;
  }>;
}

export default function DedicatedLessonSlugPage({ params }: LessonSlugPageProps) {
  const { class: classParam, subject: subjectParam, chapter: chapterParam, slug: slugParam } = use(params);

  return (
    <SplitScreenChapterLearningView
      classParam={classParam}
      subjectParam={subjectParam}
      chapterParam={chapterParam}
      slugParam={slugParam}
    />
  );
}
