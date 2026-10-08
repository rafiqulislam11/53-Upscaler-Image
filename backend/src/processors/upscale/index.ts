import { IUpscaleProvider } from './upscaleProvider.interface';
import { LocalUpscaler } from './localUpscaler';
import { AIUpscalerAPI } from './aiUpscalerAPI';
import { UpscaleProviderType } from '../../types/shared';

export class UpscaleProviderFactory {
  private static localProvider = new LocalUpscaler();
  private static aiProvider = new AIUpscalerAPI();

  public static getProvider(type: UpscaleProviderType = 'local'): IUpscaleProvider {
    if (type === 'ai') {
      return this.aiProvider;
    }
    return this.localProvider;
  }
}

export * from './upscaleProvider.interface';
export * from './localUpscaler';
export * from './aiUpscalerAPI';
