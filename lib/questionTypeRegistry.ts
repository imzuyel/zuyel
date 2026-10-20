export interface QuestionTypeDefinition {
  id: string;
  name: string;
  nameBangla: string;
  description: string;
  validate: (questionData: any) => any;
}

export const QuestionTypeRegistry: Record<string, QuestionTypeDefinition> = {
  mcq_single: {
    id: "mcq_single",
    name: "Multiple Choice (Single)",
    nameBangla: "MCQ (একক উত্তর)",
    description: "Generate exactly 4 options with correctIndex as a 0-based index of the correct option.",
    validate: (questionData: any) => {
      let options = Array.isArray(questionData.options) ? questionData.options : [];
      if (options.length < 2) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }
      let correctIndex = typeof questionData.correctIndex === "number" ? questionData.correctIndex : 0;
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }
      // Ensure unique options
      const seen = new Set();
      options = options.map((opt: string, idx: number) => {
        const text = (opt || "").trim() || `Option ${String.fromCharCode(65 + idx)}`;
        if (seen.has(text)) {
          return `${text} (alt)`;
        }
        seen.add(text);
        return text;
      });
      return { options, correctIndex };
    }
  },
  mcq_multiple: {
    id: "mcq_multiple",
    name: "Multiple Choice (Multiple)",
    nameBangla: "MCQ (বহু উত্তর)",
    description: "Generate exactly 4 options with correctIndices as a list of 0-based indices of all correct options (at least 2 correct).",
    validate: (questionData: any) => {
      let options = Array.isArray(questionData.options) ? questionData.options : [];
      if (options.length < 2) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }
      let correctIndices = Array.isArray(questionData.correctIndices) ? questionData.correctIndices : [0];
      correctIndices = correctIndices.filter((idx: number) => idx >= 0 && idx < options.length);
      if (correctIndices.length === 0) {
        correctIndices = [0];
      }
      return { options, correctIndices };
    }
  },
  true_false: {
    id: "true_false",
    name: "True / False",
    nameBangla: "সত্য / মিথ্যা",
    description: "Generate a statement. Include correctAnswer (true or false).",
    validate: (questionData: any) => {
      const correctAnswer = typeof questionData.correctAnswer === "boolean" ? questionData.correctAnswer : true;
      return { correctAnswer };
    }
  },
  matching: {
    id: "matching",
    name: "Matching Left-Right",
    nameBangla: "বাম-ডান মিলকরণ",
    description: "Generate a list of pairs, each with left and right text (minimum 3 pairs, maximum 5 pairs).",
    validate: (questionData: any) => {
      let pairs = Array.isArray(questionData.pairs) ? questionData.pairs : [];
      if (pairs.length === 0) {
        pairs = [{ left: "Item 1", right: "Match 1" }];
      }
      return { pairs };
    }
  },
  ordering: {
    id: "ordering",
    name: "Ordering",
    nameBangla: "ক্রম বিন্যাস",
    description: "Generate ordered list of sequence items in correct order.",
    validate: (questionData: any) => {
      let items = Array.isArray(questionData.items) ? questionData.items : [];
      if (items.length === 0) {
        items = ["First", "Second", "Third"];
      }
      return { items };
    }
  },
  fill_blank: {
    id: "fill_blank",
    name: "Fill in the Blanks",
    nameBangla: "শূন্যস্থান পূরণ",
    description: "Generate a sentence containing a blank space or placeholder with acceptedAnswers as acceptable answers.",
    validate: (questionData: any) => {
      let acceptedAnswers = Array.isArray(questionData.acceptedAnswers) ? questionData.acceptedAnswers : [];
      if (acceptedAnswers.length === 0) {
        acceptedAnswers = ["Answer"];
      }
      const caseSensitive = typeof questionData.caseSensitive === "boolean" ? questionData.caseSensitive : false;
      return { acceptedAnswers, caseSensitive };
    }
  },
  short_answer: {
    id: "short_answer",
    name: "Short Answer",
    nameBangla: "সংক্ষিপ্ত প্রশ্ন",
    description: "Generate short answer question with expectedAnswerKeyword highlighting core concept.",
    validate: (questionData: any) => {
      const expectedAnswerKeyword = questionData.expectedAnswerKeyword || "";
      return { expectedAnswerKeyword };
    }
  },
  image_choice: {
    id: "image_choice",
    name: "Image Choice",
    nameBangla: "চিত্র ভিত্তিক MCQ",
    description: "Generate exactly 4 options as visual text descriptors with correctIndex.",
    validate: (questionData: any) => {
      let options = Array.isArray(questionData.options) ? questionData.options : [];
      if (options.length < 2) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }
      let correctIndex = typeof questionData.correctIndex === "number" ? questionData.correctIndex : 0;
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }
      return { options, correctIndex };
    }
  },
  poll: {
    id: "poll",
    name: "Poll / Survey",
    nameBangla: "পোল / জরিপ",
    description: "Generate exactly 4 survey options.",
    validate: (questionData: any) => {
      let options = Array.isArray(questionData.options) ? questionData.options : [];
      if (options.length === 0) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }
      return { options };
    }
  }
};
