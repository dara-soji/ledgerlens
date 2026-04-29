'use client'

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FaRegFileAlt, FaCheckCircle } from 'react-icons/fa';
import File from "@/components/File";
import Button from "@/components/Button";
import DashboardLayout from "./dashboardLayout";
import FileUploader from "@/components/FileUploader";
import ResultsView from "@/components/ResultsView";
import { uploadFile, pollJobStatus } from "../services/uploadService";
import { UploadJob, FileWithProgress } from "../types/types";
import { truncateFileName } from "../lib/utilities";

export default function Home() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [jobs, setJobs] = useState<Map<string, UploadJob>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const pollCleanupFunctions = useRef<Map<string, () => void>>(new Map());

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollCleanupFunctions.current.forEach(cleanup => cleanup());
    };
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one PDF file');
      return;
    }

    // Check if there are any files that haven't been uploaded yet
    const filesToUpload = files.filter((file) => {
      const job = file.jobId ? jobs.get(file.jobId) : undefined;
      return !job || (job.status !== 'completed' && job.status !== 'failed');
    });

    if (filesToUpload.length === 0) {
      toast.success('All files have already been processed');
      return;
    }

    setIsUploading(true);

    try {
      // Upload only files that need to be uploaded
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const originalIndex = files.indexOf(file);

        // Update file status to uploading
        setFiles(prev => prev.map((f, index) =>
          index === originalIndex
            ? { ...f, uploadStatus: 'uploading' as const }
            : f
        ));

        try {
          const response = await uploadFile(file);

          // Update file with job ID and queued status
          setFiles(prev => prev.map((f, index) =>
            index === originalIndex
              ? {
                ...f,
                jobId: response.jobId,
                uploadStatus: 'queued' as const
              }
              : f
          ));

          // Start polling for this job
          const cleanup = pollJobStatus(response.jobId, (job) => {
            setJobs(prev => new Map(prev.set(job.jobId, job)));
          });

          pollCleanupFunctions.current.set(response.jobId, cleanup);

          toast.success(`${truncateFileName(file.name, 25)} queued for processing`);

        } catch (error: any) {
          // Update file status to failed
          setFiles(prev => prev.map((f, index) =>
            index === originalIndex
              ? { ...f, uploadStatus: 'failed' as const }
              : f
          ));

          toast.error(`Failed to upload ${truncateFileName(file.name, 25)}: ${error.response?.data?.message || error.message}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearCompleted = () => {
    setFiles(prev => prev.filter(file => {
      const job = file.jobId ? jobs.get(file.jobId) : null;
      const isCompleted = job?.status === 'completed' || job?.status === 'failed';

      // Cleanup polling for completed jobs
      if (isCompleted && file.jobId) {
        const cleanup = pollCleanupFunctions.current.get(file.jobId);
        if (cleanup) {
          cleanup();
          pollCleanupFunctions.current.delete(file.jobId);
        }
        setJobs(prev => {
          const newJobs = new Map(prev);
          newJobs.delete(file.jobId!);
          return newJobs;
        });
      }

      return !isCompleted;
    }));
  };

  const hasCompletedJobs = Array.from(jobs.values()).some(job =>
    job.status === 'completed' || job.status === 'failed'
  );

  return (
    <DashboardLayout>
      <section className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-left mb-2">Process statements</h1>
          <p className="text-gray-500">
            Upload bank statement PDFs for asynchronous parsing and AI-assisted extraction.
          </p>
        </div>

        <FileUploader className="mb-10" setFiles={setFiles} files={files} />

        {files.length > 0 && (
          <div className="space-y-8 mb-6">
            {/* Upload Queue Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Queue</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6">
                {files.map((file, index) => {
                  const job = file.jobId ? jobs.get(file.jobId) : undefined;
                  // Only show files that are not completed
                  if (job?.status === 'completed') return null;

                  return (
                    <File
                      key={`${file.name}-${index}`}
                      file={file}
                      job={job}
                      uploadStatus={file.uploadStatus}
                    />
                  );
                })}
                {/* Show empty state if no active uploads */}
                {files.every((file) => {
                  const job = file.jobId ? jobs.get(file.jobId) : undefined;
                  return job?.status === 'completed';
                }) && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No files in queue</p>
                      <p className="text-xs">Upload more files to see them here</p>
                    </div>
                  )}
              </div>

              {/* Upload & Process Button */}
              <div className="flex gap-4">
                <Button
                  label={isUploading ? "Uploading..." : "Upload & Process"}
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={isUploading || files.length === 0}
                />

                {hasCompletedJobs && (
                  <Button
                    label="Clear Completed"
                    className="bg-gray-600 hover:bg-gray-700"
                    onClick={handleClearCompleted}
                  />
                )}
              </div>
            </div>

            {/* Completed Results Section */}
            {Array.from(jobs.values()).some(job => job.status === 'completed') && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Documents</h3>
                <div className="space-y-4">
                  {Array.from(jobs.values())
                    .filter(job => job.status === 'completed')
                    .sort((a, b) => {
                      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                      return bTime - aTime;
                    })
                    .map((job) => (
                      <div key={job.jobId} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        <ResultsView job={job} />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Processing Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Queued:</span> {' '}
                <span className="font-medium">
                  {Array.from(jobs.values()).filter(job => job.status === 'queued' || job.status === 'delayed').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Processing:</span> {' '}
                <span className="font-medium">
                  {Array.from(jobs.values()).filter(job => job.status === 'active').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span> {' '}
                <span className="font-medium text-green-600">
                  {Array.from(jobs.values()).filter(job => job.status === 'completed').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Failed:</span> {' '}
                <span className="font-medium text-red-600">
                  {Array.from(jobs.values()).filter(job => job.status === 'failed').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
