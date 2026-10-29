import {Config} from '@remotion/cli/config';

// В облачной среде используем предустановленный Chromium вместо скачивания своего.
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
