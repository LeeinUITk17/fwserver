import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageProcessingService {
  async captureSnapshot(rtspUrl: string): Promise<Buffer | null> {
    const tempOutputPath = path.join('/tmp', `snapshot_${Date.now()}.jpg`);
    return new Promise((resolve, reject) => {
      ffmpeg(rtspUrl)
        .inputOptions(['-rtsp_transport tcp'])
        .outputOptions(['-frames:v 1', '-q:v 2'])
        .output(tempOutputPath)
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(tempOutputPath);
            await fs.unlink(tempOutputPath);
            resolve(buffer);
          } catch (readError) {
            reject(
              new Error(
                `Failed to read or delete snapshot: ${readError.message}`,
              ),
            );
          }
        })
        .on('error', (err) => {
          fs.unlink(tempOutputPath).catch(() => {}); // Clean up temp file
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .run();
    });
  }
}
