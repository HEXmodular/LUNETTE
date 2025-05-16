// import viteLogo from '/vite.svg'
import React from 'react'
import { useEffect, useState } from 'react'
import { useWebSocketAudioInput } from '@audio/webSocketAudioInput'
import { useReverbAlgo } from '@audio/reverbAlgo'
import { SwipeScreensControl } from './controls/swipe-screens-control/swipe-screens-control'
import MainScreen from './screens/main-screen'
import EffectsScreen from './screens/effects-screen'
import { KeyboardScreen } from './screens/keyboard-screen'
import { OscillatorProvider } from '@contexts/OscillatorContext'
import { TouchProvider, useTouch } from './contexts/touch-context'

import './App.css'

const AppContent: React.FC = () => {
  const wsUrl = import.meta.env.DEV ? 'https://lunette.local/ws' : '/ws';

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioEngineStarted, setAudioEngineStarted] = useState(false);
  const { audioWorkletNode } = useWebSocketAudioInput(audioContext, wsUrl);
  const { reverbAlgoNode, setReverbAlgoParameters } = useReverbAlgo(audioContext);
  const { isTouching } = useTouch();

  useEffect(() => {
    if (isTouching) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }
  }, [isTouching]);

  useEffect(() => {
    console.log('audioEngineStarted', audioEngineStarted);
    if (audioEngineStarted) {
      const audioContextRef = new AudioContext();
      setAudioContext(audioContextRef);
    }
  }, [audioEngineStarted]);

  useEffect(() => {
    console.log('audioContext', audioContext);
    console.log('audioWorkletNode', audioWorkletNode);
    if (audioContext && audioWorkletNode && reverbAlgoNode) {
      audioWorkletNode.connect(reverbAlgoNode.input);
      reverbAlgoNode.connect(audioContext.destination);
    }
  }, [audioContext, audioWorkletNode, reverbAlgoNode]);

  return (
    <OscillatorProvider>
      <div className="app">
        <div className="content-block">
          {!audioEngineStarted && <button onClick={() => {
            setAudioEngineStarted(true);
          }}>START AUDIO ENGINE</button>}
        </div>
        <SwipeScreensControl onScreenChange={(index) => console.log(`Switched to screen ${index}`)}>
          <KeyboardScreen />
          <MainScreen />
          <div>
            <EffectsScreen setReverbAlgoParameters={setReverbAlgoParameters} />
          </div>
        </SwipeScreensControl>
      </div>
    </OscillatorProvider>
  );
};

const App: React.FC = () => {
  return (
    <TouchProvider>
      <AppContent />
    </TouchProvider>
  );
};

export default App;
