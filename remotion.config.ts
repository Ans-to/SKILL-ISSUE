import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');
Config.setConcurrency('100%');
Config.setOverwriteOutput(true);

if (fs.existsSync('/tmp/chromium')) {
  Config.setBrowserExecutable('/tmp/chromium');
  Config.setChromiumOpenGlRenderer('swangle');
  if (fs.existsSync('/tmp/al2023')) {
    const extraLd = '/tmp/al2023/lib:/tmp/al2023:/tmp';
    const currentLd = process.env.LD_LIBRARY_PATH ?? '';
    if (!currentLd.includes('/tmp/al2023')) {
      process.env.LD_LIBRARY_PATH = currentLd ? `${extraLd}:${currentLd}` : extraLd;
    }
  }
}
