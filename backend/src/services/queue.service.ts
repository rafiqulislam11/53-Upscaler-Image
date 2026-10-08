import { v4 as uuidv4 } from 'uuid';
import { ProcessingJob, ToolId } from '../types/shared';

export class QueueService {
  private jobs: Map<string, ProcessingJob> = new Map();

  public createJob(imageId: string, tool: ToolId): ProcessingJob {
    const job: ProcessingJob = {
      id: uuidv4(),
      imageId,
      tool,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    this.jobs.set(job.id, job);
    return job;
  }

  public getJob(id: string): ProcessingJob | undefined {
    return this.jobs.get(id);
  }

  public updateProgress(id: string, progress: number, message?: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'processing';
      job.progress = Math.min(100, Math.max(0, Math.round(progress)));
      if (message) job.message = message;
    }
  }

  public completeJob(
    id: string,
    resultUrl: string,
    resultWidth: number,
    resultHeight: number,
    resultSize: number,
    ppi: number,
    durationMs: number
  ): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.resultUrl = resultUrl;
      job.resultWidth = resultWidth;
      job.resultHeight = resultHeight;
      job.resultSize = resultSize;
      job.ppi = ppi;
      job.durationMs = durationMs;
      job.completedAt = new Date().toISOString();
    }
  }

  public failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date().toISOString();
    }
  }

  public getAllJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const queueService = new QueueService();
