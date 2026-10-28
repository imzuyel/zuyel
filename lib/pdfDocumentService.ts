import { prisma, isPrismaAvailable } from "@/lib/prisma";
import { institutionalDb, PdfDocument, PdfPage, PdfChunk, AIGenerationJob, AIGeneratedQuestion } from "@/lib/database";
import { StorageService } from "@/lib/storageService";
import { COMMON_SUBJECTS_9_12, PRE_VOCATIONAL_SUBJECTS } from "@/lib/academicStructure";
import { AIService } from "@/lib/aiService";

export interface PdfDocumentFilter {
  search?: string;
  classId?: string | number;
  tradeId?: string | number;
  subjectId?: string | number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DocumentStats {
  totalDocuments: number;
  processedCount: number;
  processingCount: number;
  pendingCount: number;
  failedCount: number;
  archivedCount: number;
  totalQuestionsCount: number;
}

export interface CreateDocumentInput {
  title: string;
  originalFilename: string;
  description?: string;
  classId?: number;
  tradeId?: number;
  subjectId?: number;
  sectionId?: number;
  academicYearId?: number;
  chapter?: string;
  topic?: string;
  tags?: string[];
  storageKey: string;
  mimeType: string;
  fileSize: number;
  storageProvider?: "local" | "s3" | "gcs" | "mock";
  uploadedBy?: number;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  classId?: number;
  tradeId?: number;
  subjectId?: number;
  sectionId?: number;
  chapter?: string;
  topic?: string;
  tags?: string[];
  incrementVersion?: boolean;
}

// Utility to resolve entity names for enriched responses
function resolveEntityNames(doc: Partial<PdfDocument>) {
  const classes = institutionalDb.classes || [];
  const trades = institutionalDb.trades || [];
  const allSubjects = [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];

  const targetClass = doc.classId ? classes.find((c) => c.id === doc.classId) : null;
  const targetTrade = doc.tradeId ? trades.find((t) => t.id === doc.tradeId) : null;
  const targetSubject = doc.subjectId ? allSubjects.find((s) => s.id === doc.subjectId) : null;

  return {
    className: targetClass ? targetClass.name : undefined,
    classNameBangla: targetClass ? (targetClass as any).nameBangla : undefined,
    tradeCode: targetTrade ? targetTrade.code : undefined,
    tradeName: targetTrade ? targetTrade.name : undefined,
    tradeNameBangla: targetTrade ? targetTrade.nameBangla : undefined,
    subjectName: targetSubject ? targetSubject.name : undefined,
    subjectCode: targetSubject ? (targetSubject as any).code : undefined,
  };
}

export class PdfDocumentService {
  /**
   * Retrieves a paginated and filtered list of PDF documents along with library statistics
   */
  static async listDocuments(filter: PdfDocumentFilter) {
    const {
      search = "",
      classId,
      tradeId,
      subjectId,
      status,
      page = 1,
      limit = 10,
    } = filter;

    const searchLower = search.trim().toLowerCase();
    const classNum = classId && classId !== "all" ? Number(classId) : undefined;
    const tradeNum = tradeId && tradeId !== "all" ? Number(tradeId) : undefined;
    const subjectNum = subjectId && subjectId !== "all" ? Number(subjectId) : undefined;
    const statusFilter = status && status !== "all" ? status : undefined;

    let allDocs: PdfDocument[] = [];

    if (isPrismaAvailable() && prisma?.pdfDocument) {
      try {
        const whereClause: any = {};

        if (statusFilter) {
          whereClause.processingStatus = statusFilter.toUpperCase();
        }
        if (classNum !== undefined) {
          whereClause.classId = classNum;
        }
        if (tradeNum !== undefined) {
          whereClause.tradeId = tradeNum;
        }
        if (subjectNum !== undefined) {
          whereClause.subjectId = subjectNum;
        }
        if (searchLower) {
          whereClause.OR = [
            { title: { contains: searchLower } },
            { originalFilename: { contains: searchLower } },
            { description: { contains: searchLower } },
            { chapter: { contains: searchLower } },
            { topic: { contains: searchLower } },
          ];
        }

        const [dbDocs, dbTotal] = await Promise.all([
          prisma.pdfDocument.findMany({
            where: whereClause,
            include: {
              class: true,
              trade: true,
              subject: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.pdfDocument.count({ where: whereClause }),
        ]);

        if (dbDocs && dbDocs.length > 0) {
          allDocs = dbDocs.map((d: any) => ({
            id: d.id,
            title: d.title,
            originalFilename: d.originalFilename,
            description: d.description || "",
            classId: d.classId || undefined,
            tradeId: d.tradeId || undefined,
            subjectId: d.subjectId || undefined,
            sectionId: d.sectionId || undefined,
            academicYearId: d.academicYearId || 2026,
            chapter: d.chapter || "",
            topic: d.topic || "",
            tags: d.tagsJson ? JSON.parse(d.tagsJson) : [],
            storageProvider: (d.storageProvider?.toLowerCase() || "local") as any,
            storageKey: d.storageKey,
            mimeType: d.mimeType,
            fileSize: d.fileSize,
            pageCount: d.pageCount,
            processingStatus: (d.processingStatus?.toLowerCase() || "processed") as any,
            uploadedBy: d.uploadedById || 1,
            version: d.version || 1,
            generatedQuestionsCount: d.generatedQuestionsCount || 0,
            createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
            updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
            archivedAt: d.archivedAt instanceof Date ? d.archivedAt.toISOString() : d.archivedAt || undefined,
          }));

          // Compute stats from database
          const allDbDocs = await prisma.pdfDocument.findMany({ select: { processingStatus: true, generatedQuestionsCount: true } });
          const stats: DocumentStats = {
            totalDocuments: allDbDocs.length,
            processedCount: allDbDocs.filter((d: any) => d.processingStatus === "PROCESSED").length,
            processingCount: allDbDocs.filter((d: any) => d.processingStatus === "PROCESSING").length,
            pendingCount: allDbDocs.filter((d: any) => d.processingStatus === "UPLOADED" || d.processingStatus === "UPLOADING").length,
            failedCount: allDbDocs.filter((d: any) => d.processingStatus === "FAILED").length,
            archivedCount: allDbDocs.filter((d: any) => d.processingStatus === "ARCHIVED").length,
            totalQuestionsCount: allDbDocs.reduce((sum: number, d: any) => sum + (d.generatedQuestionsCount || 0), 0),
          };

          const enriched = allDocs.map((doc) => ({
            ...doc,
            ...resolveEntityNames(doc),
          }));

          return {
            documents: enriched,
            pagination: {
              total: dbTotal,
              page,
              limit,
              totalPages: Math.ceil(dbTotal / limit) || 1,
            },
            stats,
          };
        }
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma listDocuments failed, falling back to in-memory store:", err);
      }
    }

    // In-Memory Fallback Store
    let filtered = [...institutionalDb.pdfDocuments];

    if (searchLower) {
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.originalFilename.toLowerCase().includes(searchLower) ||
          (d.description && d.description.toLowerCase().includes(searchLower)) ||
          (d.chapter && d.chapter.toLowerCase().includes(searchLower)) ||
          (d.topic && d.topic.toLowerCase().includes(searchLower)) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchLower)))
      );
    }

    if (classNum !== undefined) {
      filtered = filtered.filter((d) => d.classId === classNum);
    }

    if (tradeNum !== undefined) {
      filtered = filtered.filter((d) => d.tradeId === tradeNum);
    }

    if (subjectNum !== undefined) {
      filtered = filtered.filter((d) => d.subjectId === subjectNum);
    }

    if (statusFilter) {
      filtered = filtered.filter((d) => d.processingStatus === statusFilter);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const stats: DocumentStats = {
      totalDocuments: institutionalDb.pdfDocuments.length,
      processedCount: institutionalDb.pdfDocuments.filter((d) => d.processingStatus === "processed").length,
      processingCount: institutionalDb.pdfDocuments.filter((d) => d.processingStatus === "processing").length,
      pendingCount: institutionalDb.pdfDocuments.filter((d) => d.processingStatus === "uploaded" || d.processingStatus === "uploading").length,
      failedCount: institutionalDb.pdfDocuments.filter((d) => d.processingStatus === "failed").length,
      archivedCount: institutionalDb.pdfDocuments.filter((d) => d.processingStatus === "archived").length,
      totalQuestionsCount: institutionalDb.pdfDocuments.reduce((sum, d) => sum + (d.generatedQuestionsCount || 0), 0),
    };

    const enriched = paginated.map((doc) => ({
      ...doc,
      ...resolveEntityNames(doc),
    }));

    return {
      documents: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    };
  }

  /**
   * Retrieves single document by ID
   */
  static async getDocumentById(id: string): Promise<(PdfDocument & ReturnType<typeof resolveEntityNames>) | null> {
    if (isPrismaAvailable() && prisma?.pdfDocument) {
      try {
        const dbDoc = await prisma.pdfDocument.findUnique({
          where: { id },
          include: { class: true, trade: true, subject: true },
        });
        if (dbDoc) {
          const doc: PdfDocument = {
            id: dbDoc.id,
            title: dbDoc.title,
            originalFilename: dbDoc.originalFilename,
            description: dbDoc.description || "",
            classId: dbDoc.classId || undefined,
            tradeId: dbDoc.tradeId || undefined,
            subjectId: dbDoc.subjectId || undefined,
            sectionId: dbDoc.sectionId || undefined,
            academicYearId: dbDoc.academicYearId || 2026,
            chapter: dbDoc.chapter || "",
            topic: dbDoc.topic || "",
            tags: dbDoc.tagsJson ? JSON.parse(dbDoc.tagsJson) : [],
            storageProvider: (dbDoc.storageProvider?.toLowerCase() || "local") as any,
            storageKey: dbDoc.storageKey,
            mimeType: dbDoc.mimeType,
            fileSize: dbDoc.fileSize,
            pageCount: dbDoc.pageCount,
            processingStatus: (dbDoc.processingStatus?.toLowerCase() || "processed") as any,
            uploadedBy: dbDoc.uploadedById || 1,
            version: dbDoc.version || 1,
            generatedQuestionsCount: dbDoc.generatedQuestionsCount || 0,
            createdAt: dbDoc.createdAt instanceof Date ? dbDoc.createdAt.toISOString() : String(dbDoc.createdAt),
            updatedAt: dbDoc.updatedAt instanceof Date ? dbDoc.updatedAt.toISOString() : String(dbDoc.updatedAt),
            archivedAt: dbDoc.archivedAt instanceof Date ? dbDoc.archivedAt.toISOString() : dbDoc.archivedAt || undefined,
          };
          return {
            ...doc,
            ...resolveEntityNames(doc),
          };
        }
      } catch (err) {
        console.warn("[PdfDocumentService] getDocumentById fallback to memory:", err);
      }
    }

    const doc = institutionalDb.pdfDocuments.find((d) => d.id === id);
    if (!doc) return null;
    return {
      ...doc,
      ...resolveEntityNames(doc),
    };
  }

  /**
   * Creates a new document record and persists it to both DB and institutional store
   */
  static async createDocument(input: CreateDocumentInput): Promise<PdfDocument> {
    const id = `doc-${Date.now()}`;
    const nowStr = new Date().toISOString();

    const newDoc: PdfDocument = {
      id,
      title: input.title,
      originalFilename: input.originalFilename,
      description: input.description || "",
      classId: input.classId,
      tradeId: input.tradeId,
      subjectId: input.subjectId,
      sectionId: input.sectionId,
      academicYearId: input.academicYearId || 2026,
      chapter: input.chapter || "",
      topic: input.topic || "",
      tags: input.tags || [],
      storageProvider: input.storageProvider || "local",
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      pageCount: 1,
      processingStatus: "uploaded",
      uploadedBy: input.uploadedBy || 1,
      version: 1,
      generatedQuestionsCount: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // Save in memory store
    institutionalDb.pdfDocuments.unshift(newDoc);

    // Persist to Prisma if available
    if (isPrismaAvailable() && prisma?.pdfDocument) {
      try {
        await prisma.pdfDocument.create({
          data: {
            id,
            title: input.title,
            originalFilename: input.originalFilename,
            description: input.description || null,
            classId: input.classId || null,
            tradeId: input.tradeId || null,
            subjectId: input.subjectId || null,
            sectionId: input.sectionId || null,
            academicYearId: input.academicYearId || 2026,
            chapter: input.chapter || null,
            topic: input.topic || null,
            tagsJson: input.tags ? JSON.stringify(input.tags) : null,
            storageProvider: input.storageProvider || "local",
            storageKey: input.storageKey,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            pageCount: 1,
            processingStatus: "UPLOADED",
            uploadedById: input.uploadedBy || 1,
            version: 1,
            generatedQuestionsCount: 0,
          },
        });
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma createDocument error, fallback active:", err);
      }
    }

    return newDoc;
  }

  /**
   * Updates document metadata
   */
  static async updateDocument(id: string, updates: UpdateDocumentInput): Promise<PdfDocument | null> {
    const doc = institutionalDb.pdfDocuments.find((d) => d.id === id);
    if (!doc) return null;

    if (updates.title !== undefined) doc.title = updates.title;
    if (updates.description !== undefined) doc.description = updates.description;
    if (updates.classId !== undefined) doc.classId = updates.classId;
    if (updates.tradeId !== undefined) doc.tradeId = updates.tradeId;
    if (updates.subjectId !== undefined) doc.subjectId = updates.subjectId;
    if (updates.sectionId !== undefined) doc.sectionId = updates.sectionId;
    if (updates.chapter !== undefined) doc.chapter = updates.chapter;
    if (updates.topic !== undefined) doc.topic = updates.topic;
    if (updates.tags !== undefined) doc.tags = updates.tags;
    if (updates.incrementVersion) doc.version = (doc.version || 1) + 1;

    doc.updatedAt = new Date().toISOString();

    if (isPrismaAvailable() && prisma?.pdfDocument) {
      try {
        await prisma.pdfDocument.update({
          where: { id },
          data: {
            title: doc.title,
            description: doc.description || null,
            classId: doc.classId || null,
            tradeId: doc.tradeId || null,
            subjectId: doc.subjectId || null,
            sectionId: doc.sectionId || null,
            chapter: doc.chapter || null,
            topic: doc.topic || null,
            tagsJson: doc.tags ? JSON.stringify(doc.tags) : null,
            version: doc.version,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma updateDocument error:", err);
      }
    }

    return doc;
  }

  /**
   * Deletes or safely archives document based on question references
   */
  static async deleteOrArchiveDocument(id: string): Promise<{ success: boolean; archived: boolean; message: string }> {
    const docIdx = institutionalDb.pdfDocuments.findIndex((d) => d.id === id);
    if (docIdx === -1) {
      return { success: false, archived: false, message: "Document not found." };
    }

    const doc = institutionalDb.pdfDocuments[docIdx];
    const hasQuestions = institutionalDb.aiGeneratedQuestions.some((q) => q.documentId === id);
    const hasJobs = institutionalDb.aiGenerationJobs.some((j) => j.documentId === id);

    if (hasQuestions || hasJobs) {
      // Soft archive to protect question bank relationships
      doc.processingStatus = "archived";
      doc.archivedAt = new Date().toISOString();
      doc.updatedAt = new Date().toISOString();

      try {
        await StorageService.delete(doc.storageKey);
      } catch (err) {
        console.warn("[PdfDocumentService] Storage file deletion warning:", err);
      }

      if (isPrismaAvailable() && prisma?.pdfDocument) {
        try {
          await prisma.pdfDocument.update({
            where: { id },
            data: {
              processingStatus: "ARCHIVED",
              archivedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } catch (err) {
          console.warn("[PdfDocumentService] Prisma archive error:", err);
        }
      }

      return {
        success: true,
        archived: true,
        message: "ডকুমেন্টটিতে পূর্বে তৈরি করা এআই প্রশ্ন ব্যাংকের ইতিহাস রয়েছে। তাই এটি নিরাপদে আর্কাইভ করা হয়েছে এবং স্টোরেজ ফাইল মুছে দেওয়া হয়েছে।",
      };
    }

    // Hard deletion
    try {
      await StorageService.delete(doc.storageKey);
    } catch (err) {
      console.warn("[PdfDocumentService] Storage file delete error:", err);
    }

    // Remove pages and chunks
    institutionalDb.pdfPages = institutionalDb.pdfPages.filter((p) => p.documentId !== id);
    institutionalDb.pdfChunks = institutionalDb.pdfChunks.filter((c) => c.documentId !== id);
    institutionalDb.pdfDocuments.splice(docIdx, 1);

    if (isPrismaAvailable() && prisma?.pdfDocument) {
      try {
        await prisma.pdfChunk.deleteMany({ where: { documentId: id } });
        await prisma.pdfPage.deleteMany({ where: { documentId: id } });
        await prisma.pdfDocument.delete({ where: { id } });
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma hard delete error:", err);
      }
    }

    return {
      success: true,
      archived: false,
      message: "ডকুমেন্ট ও এর সংশ্লিষ্ট সকল পৃষ্ঠা ও টেক্সট চাঙ্ক স্থায়ীভাবে মুছে ফেলা হয়েছে।",
    };
  }

  /**
   * Persists extracted pages and chunks after cognitive OCR / parsing
   */
  static async saveExtractedPagesAndChunks(
    documentId: string,
    extractedPages: { pageNumber: number; text: string; isScanned: boolean }[],
    extractedChunks: { chunkIndex: number; startPage: number; endPage: number; text: string }[],
    isScannedDoc: boolean
  ) {
    const doc = institutionalDb.pdfDocuments.find((d) => d.id === documentId);
    const nowStr = new Date().toISOString();

    if (doc) {
      doc.pageCount = extractedPages.length;
      doc.processingStatus = isScannedDoc ? "failed" : "processed";
      doc.updatedAt = nowStr;
    }

    // In-memory update
    institutionalDb.pdfPages = institutionalDb.pdfPages.filter((p) => p.documentId !== documentId);
    institutionalDb.pdfChunks = institutionalDb.pdfChunks.filter((c) => c.documentId !== documentId);

    const savedPages: PdfPage[] = extractedPages.map((p) => ({
      id: `page-${documentId}-${p.pageNumber}-${Date.now()}`,
      documentId,
      pageNumber: p.pageNumber,
      extractedText: p.text,
      isScanned: p.isScanned,
      extractionStatus: p.isScanned ? "failed" : "completed",
      createdAt: nowStr,
      updatedAt: nowStr,
    }));
    institutionalDb.pdfPages.push(...savedPages);

    const savedChunks: PdfChunk[] = extractedChunks.map((c) => ({
      id: `chunk-${documentId}-${c.chunkIndex}-${Date.now()}`,
      documentId,
      chunkIndex: c.chunkIndex,
      startPage: c.startPage,
      endPage: c.endPage,
      chunkText: c.text,
      createdAt: nowStr,
      updatedAt: nowStr,
    }));
    institutionalDb.pdfChunks.push(...savedChunks);

    // Prisma persistence
    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.pdfPage.deleteMany({ where: { documentId } });
        await prisma.pdfChunk.deleteMany({ where: { documentId } });

        for (const p of savedPages) {
          await prisma.pdfPage.create({
            data: {
              id: p.id,
              documentId,
              pageNumber: p.pageNumber,
              extractedText: p.extractedText,
              isScanned: Boolean(p.isScanned),
              extractionStatus: p.extractionStatus === "completed" ? "COMPLETED" : "FAILED",
            },
          });
        }

        for (const c of savedChunks) {
          await prisma.pdfChunk.create({
            data: {
              id: c.id,
              documentId,
              chunkIndex: c.chunkIndex,
              startPage: c.startPage,
              endPage: c.endPage,
              chunkText: c.chunkText,
            },
          });
        }

        await prisma.pdfDocument.update({
          where: { id: documentId },
          data: {
            pageCount: extractedPages.length,
            processingStatus: isScannedDoc ? "FAILED" : "PROCESSED",
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma saveExtractedPagesAndChunks error:", err);
      }
    }

    return { savedPages, savedChunks };
  }

  /**
   * Retrieves extracted pages for a document
   */
  static async getPages(documentId: string): Promise<PdfPage[]> {
    if (isPrismaAvailable() && prisma?.pdfPage) {
      try {
        const dbPages = await prisma.pdfPage.findMany({
          where: { documentId },
          orderBy: { pageNumber: "asc" },
        });
        if (dbPages && dbPages.length > 0) {
          return dbPages.map((p: any) => ({
            id: p.id,
            documentId: p.documentId,
            pageNumber: p.pageNumber,
            extractedText: p.extractedText,
            isScanned: p.isScanned,
            extractionStatus: (p.extractionStatus?.toLowerCase() || "completed") as any,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
          }));
        }
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma getPages fallback:", err);
      }
    }

    return institutionalDb.pdfPages
      .filter((p) => p.documentId === documentId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  /**
   * Retrieves semantic chunks for grounding context
   */
  static async getChunks(documentId: string, pageNumbers?: number[]): Promise<PdfChunk[]> {
    if (isPrismaAvailable() && prisma?.pdfChunk) {
      try {
        const dbChunks = await prisma.pdfChunk.findMany({
          where: { documentId },
          orderBy: { chunkIndex: "asc" },
        });
        if (dbChunks && dbChunks.length > 0) {
          const mapped = dbChunks.map((c: any) => ({
            id: c.id,
            documentId: c.documentId,
            chunkIndex: c.chunkIndex,
            startPage: c.startPage,
            endPage: c.endPage,
            chunkText: c.chunkText,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
            updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
          }));

          if (pageNumbers && pageNumbers.length > 0) {
            return mapped.filter((c: any) =>
              pageNumbers.some((pNo) => pNo >= c.startPage && pNo <= c.endPage)
            );
          }
          return mapped;
        }
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma getChunks fallback:", err);
      }
    }

    const all = institutionalDb.pdfChunks
      .filter((c) => c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    if (pageNumbers && pageNumbers.length > 0) {
      return all.filter((c) => pageNumbers.some((pNo) => pNo >= c.startPage && pNo <= c.endPage));
    }
    return all;
  }

  /**
   * Retrieves grounding context text from specified pages of a PDF
   */
  static async getGroundingContext(documentId: string, pageNumbers: number[]): Promise<{
    doc: PdfDocument | null;
    contextText: string;
    pageExcerpts: { pageNumber: number; snippet: string }[];
  }> {
    const doc = await this.getDocumentById(documentId);
    if (!doc) {
      return { doc: null, contextText: "", pageExcerpts: [] };
    }

    const pages = await this.getPages(documentId);
    const selectedPages = pages.filter((p) => pageNumbers.includes(p.pageNumber));

    const pageExcerpts = selectedPages.map((p) => ({
      pageNumber: p.pageNumber,
      snippet: p.extractedText.slice(0, 800),
    }));

    // If chunking is available, retrieve matched chunks
    const chunks = await this.getChunks(documentId, pageNumbers);
    let contextText = "";

    if (chunks.length > 0) {
      contextText = chunks.map((c) => `[পৃষ্ঠা ${c.startPage}-${c.endPage}]:\n${c.chunkText}`).join("\n\n");
    } else if (selectedPages.length > 0) {
      contextText = selectedPages.map((p) => `[পৃষ্ঠা ${p.pageNumber}]:\n${p.extractedText}`).join("\n\n");
    }

    return {
      doc,
      contextText: contextText.slice(0, 6000), // Protect token limit while providing rich grounding
      pageExcerpts,
    };
  }

  /**
   * Records an AI Generation job and its generated questions linked to the document
   */
  static async recordGenerationJob(
    job: AIGenerationJob & { documentId?: string; groundedPagesJson?: string },
    questions: AIGeneratedQuestion[]
  ) {
    // Memory store
    institutionalDb.aiGenerationJobs.unshift(job);
    institutionalDb.aiGeneratedQuestions.push(...questions);

    // Increment count on document
    if (job.documentId) {
      const doc = institutionalDb.pdfDocuments.find((d) => d.id === job.documentId);
      if (doc) {
        doc.generatedQuestionsCount = (doc.generatedQuestionsCount || 0) + questions.length;
        doc.lastUsedAt = new Date().toISOString();
        doc.updatedAt = new Date().toISOString();
      }
    }

    // Prisma persistence
    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.aiGenerationJob.create({
          data: {
            id: job.id,
            documentId: job.documentId || null,
            userId: job.userId || 1,
            classId: job.classId || null,
            subjectId: job.subjectId || null,
            topic: job.topic,
            chapter: job.chapter || null,
            lesson: job.lesson || null,
            learningObjective: job.learningObjective || null,
            language: job.language || "Bangla",
            difficulty: job.difficulty || "medium",
            questionType: job.questionType || "mcq_single",
            questionCount: job.questionCount || questions.length,
            groundedPagesJson: job.groundedPagesJson || null,
            provider: job.provider || "Google Gemini",
            model: job.model || "gemini-3.8-flash",
            status: job.status === "completed" ? "COMPLETED" : "FAILED",
            errorMessage: job.errorMessage || null,
          },
        });

        for (const q of questions) {
          await prisma.aiGeneratedQuestion.create({
            data: {
              id: q.id,
              documentId: job.documentId || null,
              generationJobId: job.id,
              questionText: q.questionText,
              questionType: (q as any).questionType || "mcq_single",
              difficulty: q.difficulty || "medium",
              optionsJson: (q as any).options ? JSON.stringify((q as any).options) : null,
              correctAnswerJson: typeof (q as any).correctAnswer === "string" ? (q as any).correctAnswer : JSON.stringify((q as any).correctAnswer || ""),
              explanation: q.explanation || null,
              learningObjective: (q as any).learningObjective || null,
              bloomTaxonomy: (q as any).bloomTaxonomy || null,
              tagsJson: q.tags ? JSON.stringify(q.tags) : null,
              status: q.status || "generated",
              reviewedBy: (q as any).reviewedBy || 1,
            },
          });
        }

        if (job.documentId) {
          await prisma.pdfDocument.update({
            where: { id: job.documentId },
            data: {
              generatedQuestionsCount: { increment: questions.length },
              lastUsedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma recordGenerationJob error:", err);
      }
    }
  }

  /**
   * Retrieves past generation history jobs for a specific document
   */
  static async getGenerationHistory(documentId: string) {
    if (isPrismaAvailable() && prisma?.aiGenerationJob) {
      try {
        const dbJobs = await prisma.aiGenerationJob.findMany({
          where: { documentId },
          include: { questions: true },
          orderBy: { createdAt: "desc" },
        });
        if (dbJobs && dbJobs.length > 0) {
          return dbJobs.map((j: any) => ({
            id: j.id,
            documentId: j.documentId,
            topic: j.topic,
            questionType: j.questionType,
            questionCount: j.questionCount,
            difficulty: j.difficulty,
            status: j.status?.toLowerCase() || "completed",
            createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : String(j.createdAt),
            questionsCount: j.questions?.length || j.questionCount,
          }));
        }
      } catch (err) {
        console.warn("[PdfDocumentService] Prisma getGenerationHistory fallback:", err);
      }
    }

    return institutionalDb.aiGenerationJobs
      .filter((j) => (j as any).documentId === documentId)
      .map((j) => ({
        id: j.id,
        documentId: (j as any).documentId,
        topic: j.topic,
        questionType: j.questionType,
        questionCount: j.questionCount,
        difficulty: j.difficulty,
        status: j.status,
        createdAt: j.createdAt,
        questionsCount: institutionalDb.aiGeneratedQuestions.filter((q) => q.generationJobId === j.id).length || j.questionCount,
      }));
  }

  /**
   * Unified question generation engine from PDF source pages
   */
  static async generateQuestionsFromDocument(params: {
    documentId: string;
    fromPage?: number;
    toPage?: number;
    selectedPages?: number[];
    topic: string;
    chapter?: string;
    count?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    language?: "Bangla" | "English";
    questionType?: string;
    questionTypes?: string[];
    includeWarmup?: boolean;
    additionalInstructions?: string;
    userId?: number;
  }): Promise<{
    success: boolean;
    job: AIGenerationJob;
    questions: AIGeneratedQuestion[];
    message: string;
  }> {
    const {
      documentId,
      fromPage,
      toPage,
      selectedPages,
      topic,
      chapter,
      count = 5,
      difficulty = "medium",
      language = "Bangla",
      questionType = "mcq_single",
      questionTypes,
      includeWarmup = false,
      additionalInstructions = "",
      userId = 1,
    } = params;

    const doc = await this.getDocumentById(documentId);
    if (!doc) {
      throw new Error("ডকুমেন্টটি পাওয়া যায়নি।");
    }

    const effectiveTopic = topic && topic.trim() ? topic.trim() : (chapter || doc.topic || doc.title);

    // Compute target page numbers from fromPage/toPage or selectedPages
    let targetPageNumbers: number[] = [];
    if (fromPage !== undefined && toPage !== undefined) {
      const start = Math.max(1, Number(fromPage));
      const end = Math.max(start, Number(toPage));
      for (let p = start; p <= end; p++) {
        targetPageNumbers.push(p);
      }
    } else if (Array.isArray(selectedPages) && selectedPages.length > 0) {
      targetPageNumbers = selectedPages;
    }

    const allPages = await this.getPages(documentId);
    let validPages = allPages;

    if (targetPageNumbers.length > 0) {
      validPages = allPages.filter((p) => targetPageNumbers.includes(p.pageNumber));
    }

    validPages = validPages.filter(
      (p) => p.extractedText && p.extractedText.trim().length > 0
    );

    // If no valid pages in page table, try chunks for this document
    if (validPages.length === 0) {
      const chunks = await this.getChunks(documentId);
      if (chunks.length > 0) {
        let selectedChunks = chunks;
        if (targetPageNumbers.length > 0) {
          const filtered = chunks.filter((c) =>
            targetPageNumbers.some((p) => p >= (c.startPage || 1) && p <= (c.endPage || 999))
          );
          if (filtered.length > 0) {
            selectedChunks = filtered;
          }
        }

        validPages = selectedChunks.map((c, idx) => ({
          id: `chunk-page-${c.id || idx}`,
          documentId,
          pageNumber: c.startPage || (idx + 1),
          extractedText: c.chunkText,
          isScanned: false,
          extractionStatus: "completed" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    }

    // Smart Page-Range Fallback: If pages are empty or unreadable (<30 chars, scanned/OCR missing),
    // automatically fall back to generating using Book Title + Trade + Topic/Chapter without failing!
    const hasReadableContent = validPages.some(
      (p) => p.extractedText && p.extractedText.trim().length > 30
    );

    if (!hasReadableContent || validPages.length === 0) {
      const fallbackExcerpts = [
        `পাঠ্যবই: ${doc.title}`,
        `ট্রেড/বিষয়: ${doc.tradeName || "কারিগরি ও ভোকেশনাল শাখা"}`,
        `টপিক: ${effectiveTopic}`,
        `অধ্যায়: ${chapter || doc.chapter || "মূল অধ্যায়"}`,
        `কারিকুলাম বিবরণ: ${doc.description || "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) ভোকেশনাল শিক্ষাক্রম"}`,
        `নির্দেশনা: এই পাঠ্যবই ও অধ্যায়ের কারিকুলাম মানদণ্ড অনুযায়ী বাস্তবমুখী টেকনিক্যাল প্রশ্নাবলি তৈরি করুন।`
      ].join("\n");

      validPages = [
        {
          id: `doc-meta-${documentId}`,
          documentId,
          pageNumber: fromPage || 1,
          extractedText: fallbackExcerpts,
          isScanned: false,
          extractionStatus: "completed" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const jobId = `job-${Date.now()}`;
    const nowStr = new Date().toISOString();

    const effectiveQType = questionTypes && questionTypes.length > 0
      ? questionTypes.join(",")
      : questionType;

    const job: AIGenerationJob & { documentId?: string; groundedPagesJson?: string } = {
      id: jobId,
      documentId,
      userId,
      subjectId: doc.subjectId || 1,
      classId: doc.classId || 4,
      topic: effectiveTopic,
      chapter: chapter || doc.chapter || "",
      lesson: "",
      learningObjective: `Grounded generation from ${doc.title} (Pages: ${targetPageNumbers.length > 0 ? targetPageNumbers.join(", ") : "All"})`,
      language,
      difficulty,
      questionType: effectiveQType,
      questionCount: count,
      groundedPagesJson: JSON.stringify(validPages.map((p) => p.pageNumber)),
      provider: "Multi-Model AI Failover (Gemini / Groq / OpenRouter)",
      model: process.env.AI_MODEL || "gemini-3.8-flash",
      status: "processing",
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const pdfPagesInput = validPages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.extractedText,
    }));

    // Build comprehensive instructions with Chapter & Warmup instructions
    let enrichedInstructions = additionalInstructions || "";
    if (chapter) {
      enrichedInstructions = `অধ্যায় / নির্দেশনা: "${chapter}". ${enrichedInstructions}`.trim();
    }
    if (includeWarmup) {
      enrichedInstructions = `শুরুতে ১-২টি ইন্টারেক্টিভ ওয়ার্মআপ স্লাইড (Word Cloud বা Open Ended) যুক্ত করুন। ${enrichedInstructions}`.trim();
    }

    const generated = await AIService.generateQuestionsFromPdf({
      pdfPages: pdfPagesInput,
      topic: effectiveTopic,
      questionType: effectiveQType,
      count: Number(count) || 5,
      difficulty,
      language,
      additionalInstructions: enrichedInstructions,
    });

    const questionsToSave: AIGeneratedQuestion[] = generated.map((q, idx) => ({
      ...q,
      id: `aiq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      generationJobId: jobId,
      status: "generated",
      reviewedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    job.status = "completed";
    job.updatedAt = new Date().toISOString();

    await this.recordGenerationJob(job, questionsToSave);

    return {
      success: true,
      job,
      questions: questionsToSave,
      message: `সফলভাবে ${questionsToSave.length}টি প্রশ্ন তৈরি করা হয়েছে।`,
    };
  }
}
