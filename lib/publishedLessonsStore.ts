// Published Lesson Type and Helper Store for Student Learning Hub

export interface PublishedLesson {
  id: string | number;
  title: string;
  titleBangla?: string;
  classLabel?: string;
  tradeLabel?: string;
  subjectCode?: string;
  chapterNumber?: number;
  chapterName?: string;
  contentMarkdown?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
