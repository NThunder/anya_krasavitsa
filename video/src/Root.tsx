import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {FPS, H, W} from './theme';
import {ReelProps} from './types';

const empty: ReelProps = {duration: 5, voice: '', avatar: null, lines: [], demo: null};

export const Root: React.FC = () => (
	<Composition
		id="Reel"
		component={Reel}
		width={W}
		height={H}
		fps={FPS}
		durationInFrames={150}
		defaultProps={empty}
		calculateMetadata={({props}) => ({durationInFrames: Math.ceil((props.duration + 0.6) * FPS)})}
	/>
);
