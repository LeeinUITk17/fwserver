import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class ImageProcessingService implements OnModuleInit {
  private readonly logger = new Logger(ImageProcessingService.name);

  onModuleInit() {
    try {
      const ffmpegPath = '/opt/ffmpeg/ffmpeg';
      ffmpeg.setFfmpegPath(ffmpegPath);
      this.logger.log(`FFmpeg path explicitly set to: ${ffmpegPath}`);
      this.logger.log(
        'FFmpeg path set. Protocol availability confirmed manually via command line.',
      );
    } catch (error) {
      this.logger.error('Error setting FFmpeg path:', error);
      throw new Error(
        'Failed to configure FFmpeg path. Ensure FFmpeg is installed correctly at /opt/ffmpeg/ffmpeg.',
      );
    }
  }

  async captureSnapshot(rtspUrl: string): Promise<Buffer | null> {
    const tempDir = '/tmp';
    try {
      await fs.access(tempDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      // ... (xử lý tạo /tmp giữ nguyên) ...
      this.logger.warn(
        `/tmp directory might not exist or be inaccessible. Attempting to create...`,
      );
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (mkdirError: any) {
        this.logger.error(
          `Failed to create /tmp directory: ${mkdirError.message}`,
        );
        throw new Error(
          'Temporary directory /tmp is inaccessible or could not be created.',
        );
      }
    }

    const tempOutputPath = path.join(tempDir, `snapshot_${Date.now()}.jpg`);
    this.logger.debug(
      `Attempting to capture snapshot from ${rtspUrl} to ${tempOutputPath}`,
    );

    return new Promise((resolve, reject) => {
      // Khởi tạo ffmpeg command
      const command = ffmpeg();

      // --- Chỉ thêm các tùy chọn phân tích luồng ---
      command
        .addOption('-analyzeduration', '10M')
        .addOption('-probesize', '10M');

      // *** ĐÃ LOẠI BỎ: .addOption('-stimeout', '5000000') ***
      // Lý do: FFmpeg không nhận ra khi đặt ở đây qua fluent-ffmpeg.
      // Để FFmpeg sử dụng timeout mặc định của nó cho RTSP.

      // *** ĐÃ LOẠI BỎ: .addOption('-rtsp_transport', 'tcp') ***
      // -------------------------------------------------

      // --- Thêm input URL ---
      command.input(rtspUrl);
      // --------------------

      // --- Thêm các tùy chọn Output ---
      command
        .outputOptions(['-frames:v 1', '-q:v 2', '-f image2', '-y'])
        .output(tempOutputPath);
      // ------------------------------

      // --- Xử lý sự kiện và chạy command ---
      command
        .on('end', async () => {
          // ... (phần xử lý end giữ nguyên) ...
          this.logger.log(
            `FFmpeg successfully captured snapshot to ${tempOutputPath}`,
          );
          try {
            const buffer = await fs.readFile(tempOutputPath);
            await fs.unlink(tempOutputPath);
            this.logger.debug(
              `Successfully read and deleted ${tempOutputPath}`,
            );
            resolve(buffer);
          } catch (readError: any) {
            this.logger.error(
              `Failed to read/delete snapshot file ${tempOutputPath}: ${readError.message}`,
            );
            reject(
              new Error(
                `Failed to read or delete snapshot file: ${readError.message}`,
              ),
            );
          }
        })
        .on('error', (err, stdout, stderr) => {
          // ... (phần xử lý error giữ nguyên) ...
          this.logger.error(
            `FFmpeg process error for ${rtspUrl}: ${err.message}`,
          );
          this.logger.debug(`FFmpeg stdout: ${stdout || 'N/A'}`);
          this.logger.debug(`FFmpeg stderr: ${stderr || 'N/A'}`);
          fs.unlink(tempOutputPath).catch((unlinkErr) => {
            this.logger.warn(
              `Could not clean up temp file ${tempOutputPath} after error: ${unlinkErr.message}`,
            );
          });
          reject(new Error(`FFmpeg error: ${err.message}`));
        });
      // ----------------------------------

      command.run();
    });
  }
}
