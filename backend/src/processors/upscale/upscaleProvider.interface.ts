import { UpscaleOptions } from '../../types/shared';

export interface UpscaleResult {
  outputPath: string;
  outputFilename: string;
  outputUrl: string;
  width: number;
  height: number;
  size: number;
  ppi: number;
  providerUsed: 'local' | 'ai';
  providerMessage: string;
  durationMs: number;
}

export interface IUpscaleProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): Promise<boolean>;
  upscale(
    inputPath: string,
    options: UpscaleOptions,
    onProgress?: (percent: number, step: string) => void
  ): Promise<UpscaleResult>;
}
