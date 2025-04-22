import * as path from 'path';
import * as fs from 'fs/promises';
import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private ffmpegPath: string = '/opt/ffmpeg/ffmpeg';

  async captureSnapshot(rtspUrl: string): Promise<Buffer | null> {
    const tempDir = '/tmp';
    try {
      await fs.access(tempDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
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
      `Attempting to capture snapshot from ${rtspUrl} to ${tempOutputPath} using execFile`,
    );

    const ffmpegArgs = [
      '-loglevel',
      'error',
      '-analyzeduration',
      '50M',
      '-probesize',
      '50M',
      '-rtsp_transport',
      'tcp',
      '-i',
      rtspUrl,
      '-vframes',
      '1',
      '-q:v',
      '2',
      '-f',
      'image2',
      '-y',
      tempOutputPath,
    ];

    const timeoutMs = 60000;
    try {
      this.logger.debug(
        `Executing FFmpeg: ${this.ffmpegPath} ${ffmpegArgs.join(' ')}`,
      );
      const { stdout, stderr } = await execFileAsync(
        this.ffmpegPath,
        ffmpegArgs,
        { timeout: timeoutMs },
      );

      if (stdout) this.logger.debug(`FFmpeg stdout: ${stdout}`);
      if (stderr) this.logger.debug(`FFmpeg stderr: ${stderr}`);

      this.logger.log(
        `FFmpeg successfully created snapshot: ${tempOutputPath}`,
      );
      const buffer = await fs.readFile(tempOutputPath);
      await fs.unlink(tempOutputPath);
      this.logger.debug(`Successfully read and deleted ${tempOutputPath}`);
      return buffer;
    } catch (error: any) {
      this.logger.error(
        `Error executing FFmpeg for ${rtspUrl}: ${error.message}`,
      );
      if (error.stdout)
        this.logger.debug(`FFmpeg stdout on error: ${error.stdout}`);
      if (error.stderr)
        this.logger.debug(`FFmpeg stderr on error: ${error.stderr}`);
      if (error.signal) {
        this.logger.error(`FFmpeg process killed with signal: ${error.signal}`);
      }

      fs.unlink(tempOutputPath).catch((unlinkErr) => {
        this.logger.warn(
          `Could not clean up temp file ${tempOutputPath} after error: ${unlinkErr.message}`,
        );
      });

      throw new Error(
        `Failed to capture snapshot via FFmpeg: ${error.message}`,
      );
    }
  }
}
