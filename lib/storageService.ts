import fs from "fs";
import path from "path";

export interface StorageServiceConfig {
  maxSizeMb: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
}

export const STORAGE_CONFIG: StorageServiceConfig = {
  maxSizeMb: parseInt(process.env.MAX_PDF_SIZE_MB || "25"),
  allowedExtensions: [".pdf"],
  allowedMimeTypes: ["application/pdf"],
};

export class StorageService {
  private static getStorageDir(): string {
    const dir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Validates file size, extension, and mime-type
   */
  static validate(filename: string, mimeType: string, fileSize: number): { isValid: boolean; error?: string } {
    const ext = path.extname(filename).toLowerCase();
    
    if (!STORAGE_CONFIG.allowedExtensions.includes(ext)) {
      return { isValid: false, error: `Invalid file extension. Only ${STORAGE_CONFIG.allowedExtensions.join(", ")} allowed.` };
    }

    if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
      return { isValid: false, error: `Invalid MIME type. Expected ${STORAGE_CONFIG.allowedMimeTypes.join(", ")}.` };
    }

    const maxBytes = STORAGE_CONFIG.maxSizeMb * 1024 * 1024;
    if (fileSize > maxBytes) {
      return { isValid: false, error: `File is too large. Maximum size allowed is ${STORAGE_CONFIG.maxSizeMb}MB.` };
    }

    return { isValid: true };
  }

  /**
   * Uploads a file to permanent storage
   */
  static async upload(fileBuffer: Buffer, filename: string): Promise<{ storageKey: string; size: number }> {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedFilename}`;
    const storageDir = this.getStorageDir();
    const filePath = path.join(storageDir, uniqueName);

    // Save actual file on filesystem
    fs.writeFileSync(filePath, fileBuffer);

    return {
      storageKey: `uploads/${uniqueName}`,
      size: fileBuffer.length,
    };
  }

  /**
   * Downloads a file from storage as Buffer
   */
  static async download(storageKey: string): Promise<Buffer> {
    const filePath = path.join(process.cwd(), "public", storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  }

  /**
   * Deletes a file from storage
   */
  static async delete(storageKey: string): Promise<void> {
    const filePath = path.join(process.cwd(), "public", storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Checks if file exists in storage
   */
  static async exists(storageKey: string): Promise<boolean> {
    const filePath = path.join(process.cwd(), "public", storageKey);
    return fs.existsSync(filePath);
  }

  /**
   * Gets clean access URL
   */
  static getUrl(storageKey: string): string {
    return `/${storageKey}`;
  }

  /**
   * Gets storage metadata
   */
  static getMetadata(storageKey: string): { path: string; exists: boolean; size?: number } {
    const filePath = path.join(process.cwd(), "public", storageKey);
    const doesExist = fs.existsSync(filePath);
    return {
      path: filePath,
      exists: doesExist,
      size: doesExist ? fs.statSync(filePath).size : undefined,
    };
  }
}
