import API from "../lib/api";
import { FileUploadResponse, UploadJob } from "../types/types";

export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await API.post("/api/parse-bank-statement", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getJobStatus = async (jobId: string): Promise<UploadJob> => {
  const response = await API.get(`/api/parse-bank-statement/job/${jobId}`);
  return response.data;
};

export const pollJobStatus = (
  jobId: string,
  onUpdate: (job: UploadJob) => void,
  interval: number = 2000
): (() => void) => {
  const intervalId = setInterval(async () => {
    try {
      const job = await getJobStatus(jobId);
      onUpdate(job);

      // Stop polling if job is completed or failed
      if (job.status === "completed" || job.status === "failed") {
        clearInterval(intervalId);
      }
    } catch (error) {
      // Continue polling on error, don't stop
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
