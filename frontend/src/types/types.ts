export interface UploadJob {
  jobId: string;
  fileName: string;
  status: "queued" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  queuedAt: string;
  processedAt?: string;
  completedAt?: string;
  processingTime?: number;
  result?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface FileUploadResponse {
  message: string;
  jobId: string;
  fileName: string;
  status: string;
  queuedAt: string;
}

export interface FileWithProgress extends File {
  uploadProgress?: number;
  jobId?: string;
  uploadStatus?: "uploading" | "queued" | "processing" | "completed" | "failed";
  originalFileName?: string;
}
