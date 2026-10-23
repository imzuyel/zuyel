"use client";

import React, { use } from "react";
import SplitScreenChapterLearningView from "@/components/learning/SplitScreenChapterLearningView";

interface ChapterRoadmapPageProps {
  params: Promise<{ class: string; subject: string; chapter: string }>;
}

export default function ChapterRoadmapPage({ params }: ChapterRoadmapPageProps) {
  const { class: classParam, subject: subjectParam, chapter: chapterParam } = use(params);

  return (
    <SplitScreenChapterLearningView
      classParam={classParam}
      subjectParam={subjectParam}
      chapterParam={chapterParam}
    />
  );
}
