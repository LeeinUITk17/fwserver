import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface PredictionResponse {
  success: boolean;
  data?: {
    label: 'FIRE' | 'NOTFIRE';
    confidence: number;
  };
  message?: string;
}

@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>(
      'PYTHON_AI_SERVICE_URL',
      'http://localhost:5001/predict',
    );
    this.logger.log(`Python AI Service URL: ${this.aiServiceUrl}`);
  }

  async getFirePrediction(
    imageBase64: string,
  ): Promise<{ label: 'FIRE' | 'NOTFIRE'; confidence: number } | null> {
    if (!this.aiServiceUrl) {
      this.logger.error('PYTHON_AI_SERVICE_URL is not configured.');
      return null;
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post<PredictionResponse>(this.aiServiceUrl, {
          imageBase64,
        }),
      );

      if (response.data && response.data.success && response.data.data) {
        this.logger.log(
          `AI Prediction successful: ${JSON.stringify(response.data.data)}`,
        );
        return response.data.data;
      } else {
        this.logger.error(
          `AI Prediction failed on Python service: ${response.data?.message || 'Unknown error'}`,
        );
        return null;
      }
    } catch (error) {
      const axiosError = error as AxiosError<PredictionResponse>;
      if (axiosError.response) {
        this.logger.error(
          `AI Service error response: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
        );
      } else if (axiosError.request) {
        this.logger.error(
          `No response received from AI service at ${this.aiServiceUrl}. Is it running? Error: ${axiosError.message}`,
        );
      } else {
        this.logger.error(
          `Error setting up request to AI service: ${error.message}`,
        );
      }
      return null;
    }
  }
}
