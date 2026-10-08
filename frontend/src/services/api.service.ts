import {
  ImageMetadata,
  UpscaleOptions,
  GradientOptions,
  NoiseOptions,
  BlurOptions,
  ExportOptions,
  ApiResponse,
  ExtractedColor,
  ProcessingJob
} from '@shared/types';

const BASE_URL = '/api';

export class ApiService {
  public static async uploadImage(file: File): Promise<ImageMetadata> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    const json: ApiResponse<ImageMetadata> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to upload image.');
    }
    return json.data;
  }

  public static async deleteFile(id: string): Promise<void> {
    await fetch(`${BASE_URL}/file/${id}`, { method: 'DELETE' });
  }

  public static async upscale(filename: string, options: UpscaleOptions): Promise<any> {
    const res = await fetch(`${BASE_URL}/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, options })
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to upscale image.');
    }
    return json;
  }

  public static async extractColors(filename: string, maxColors = 8): Promise<ExtractedColor[]> {
    const res = await fetch(`${BASE_URL}/gradient/extract-colors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, maxColors })
    });

    const json: ApiResponse<ExtractedColor[]> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to extract colors.');
    }
    return json.data;
  }

  public static async generateGradient(filename: string, options: GradientOptions): Promise<any> {
    const res = await fetch(`${BASE_URL}/gradient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, options })
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to generate gradient.');
    }
    return json;
  }

  public static async generateGradientVariations(colors: string[]): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/gradient/variations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colors })
    });

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to generate variations.');
    }
    return json.data;
  }

  public static async applyNoise(filename: string, options: NoiseOptions): Promise<any> {
    const res = await fetch(`${BASE_URL}/noise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, options })
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to apply noise.');
    }
    return json;
  }

  public static async applyBlur(filename: string, options: BlurOptions): Promise<any> {
    const res = await fetch(`${BASE_URL}/blur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, options })
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to apply blur.');
    }
    return json;
  }

  public static async exportImage(filename: string, options: ExportOptions): Promise<any> {
    const res = await fetch(`${BASE_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, options })
    });

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to export image.');
    }
    return json.data;
  }

  public static async getJob(jobId: string): Promise<ProcessingJob> {
    const res = await fetch(`${BASE_URL}/job/${jobId}`);
    const json: ApiResponse<ProcessingJob> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Job not found.');
    }
    return json.data;
  }

  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
