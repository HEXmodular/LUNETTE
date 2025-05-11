// import viteLogo from '/vite.svg'
import { useEffect, useState } from 'react'

import OscillatorControl from '@controls/oscillator-control/oscillator-control'
import LogicBlock from '@controls/logic-block/logic-block'
import MixerBlock from '@controls/mixer-block/mixer-block'

import { useWebSocketAudioInput } from '@audio/webSocketAudioInput'
// import { useReverbAlgo } from '@audio/reverbAlgo'
import useOscillatorApi  from '@api/oscillatorApi'
import useLogicBlockApi from '@api/logicBlockApi'

import './App.css'

// const audioContext = new AudioContext();

function App() {

  const wsUrl = import.meta.env.DEV ? 'https://lunette.local/ws' : '/ws';

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioEngineStarted, setAudioEngineStarted] = useState(false);
  const { audioWorkletNode } = useWebSocketAudioInput(audioContext, wsUrl);
  // const { reverbAlgoNode, setReverbAlgoParameters } = useReverbAlgo(audioContext);

  const { updateOscillator } = useOscillatorApi();
  const { updateLogicBlock } = useLogicBlockApi();

  // useEffect(() => {
  //   if (audioEngineStarted && reverbAlgoNode) {
  //     setReverbAlgoParameters({
  //       delayTime1: 0.030,
  //       delayTime2: 0.020,
  //       allpassFreq1: 777,
  //       allpassFreq2: 888,
  //       allpassFreq3: 999,
  //       allpassFreq4: 666,
  //       lowpassFreq: 555,
  //       feedbackGain: 0.5,
  //     });
  //   }
  // }, [audioEngineStarted, reverbAlgoNode]);

  useEffect(() => {
    console.log('audioEngineStarted', audioEngineStarted);
    if (audioEngineStarted) {
      // audioWorkletNode.connect(reverbAlgoNode);
      const audioContextRef = new AudioContext();
      setAudioContext(audioContextRef);
      console.log('audioContextRef', audioContextRef);
      // audioWorkletNode.connect(audioContextRef.destination);
      // console.log('audioWorkletNode connected to audioContext.destination');
    }
  }, [audioEngineStarted]);

  useEffect(() => {
    console.log('audioContext', audioContext);
    console.log('audioWorkletNode', audioWorkletNode);
    if (audioContext && audioWorkletNode) {
      audioWorkletNode.connect(audioContext.destination);
      console.log('audioWorkletNode connected to audioContext.destination');
    }
  }, [audioContext, audioWorkletNode]);

  // useEffect(() => {
  //   if (audioEngineStarted && reverbAlgoNode) {
  //     reverbAlgoNode.connect(audioContext.destination);
  //   }
  // }, [audioEngineStarted, reverbAlgoNode]);

  return (
    <>
      {/* <img src={viteLogo} className="logo" alt="Vite logo" /> */}
      {/* <!-- oscilator controls --> */}

      <div className="content-block">
        {!audioEngineStarted && <button onClick={() => {
          setAudioEngineStarted(true);
        }}>START AUDIO ENGINE</button>}

      </div>
      <div className="content-block">
        <OscillatorControl showLabel onChange={(frequency) => {
          updateOscillator({
            oscillator_id: 0,
            frequency: frequency,
            amplitude: 1.0,
          });
        }} />
        <OscillatorControl onChange={(frequency) => {
          updateOscillator({
            oscillator_id: 1,
            frequency: frequency,
            amplitude: 1.0,
          });
        }} />
        <OscillatorControl onChange={(frequency) => {
          updateOscillator({
            oscillator_id: 2,
            frequency: frequency,
            amplitude: 1.0,
          });
        }} />
        <OscillatorControl onChange={(frequency) => {
          updateOscillator({
            oscillator_id: 3,
            frequency: frequency,
            amplitude: 1.0,
          });
        }} />
      </div>

      <div className="content-block">
        <div className="cols-2">
          <LogicBlock title="LOP 1" id={1} onBlockChange={updateLogicBlock} />
          <LogicBlock title="LOP 2" id={2} onBlockChange={updateLogicBlock} />
        </div>
        <div className="cols-2">  
          <LogicBlock title="LOP 3" id={3} onBlockChange={updateLogicBlock} />
          <MixerBlock id="mixer-1" title="MIXER 1" onMixerChange={() => { }} />
        </div>
      </div>


      {/* <RoundSliderControl
  value={15}
  onChange={(newValue) => {return}}
  max={100}
  // initialValue={0}
/> */}



    </>
  )
}

export default App
