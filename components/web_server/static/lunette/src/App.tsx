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

import './App.css'

const App: React.FC = () => {
  const wsUrl = import.meta.env.DEV ? 'https://lunette.local/ws' : '/ws';

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioEngineStarted, setAudioEngineStarted] = useState(false);
  const { audioWorkletNode } = useWebSocketAudioInput(audioContext, wsUrl);
  const { reverbAlgoNode, setReverbAlgoParameters } = useReverbAlgo(audioContext);

  // для отладки загрузка аудио из файла с интернета
  // const loadAudioFile = async (url: string) => {
  //   if (!audioContext) return;
    
  //   try {
  //     const response = await fetch(url);
  //     const arrayBuffer = await response.arrayBuffer();
  //     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
  //     const source = audioContext.createBufferSource();
  //     source.buffer = audioBuffer;
  //     if (reverbAlgoNode) {
  //       source.connect(reverbAlgoNode.input);
  //     }
  //     source.start(0);
  //   } catch (error) {
  //     console.error('Error loading audio file:', error);
  //   }
  // };

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

      // audioWorkletNode.connect(audioContext.destination);
    }
  }, [audioContext, audioWorkletNode, reverbAlgoNode]);

  return (
    <OscillatorProvider>
      <div className="app">
        <div className="content-block">
          {!audioEngineStarted && <button onClick={() => {
            setAudioEngineStarted(true);
          }}>START AUDIO ENGINE</button>}
          {/* {audioEngineStarted && (
            <button onClick={() => loadAudioFile('https://www2.cs.uic.edu/~i101/SoundFiles/gettysburg.wav')}>
              Load Test Audio
            </button>
          )} */}
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
  )
}

export default App
