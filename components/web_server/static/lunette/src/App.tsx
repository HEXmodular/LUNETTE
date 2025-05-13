// import viteLogo from '/vite.svg'
import { useEffect, useState } from 'react'

import OscillatorControl from '@controls/oscillator-control/oscillator-control'
import AlgorithmBlock from '@algorithm/algorithm-4o3l/algorithm-block'
import MixerBlock from '@controls/mixer-block/mixer-block'

import { useWebSocketAudioInput } from '@audio/webSocketAudioInput'
import { useReverbAlgo } from '@audio/reverbAlgo'


import useLogicBlockApi, { type LogicBlockConfig } from '@api/logicBlockApi'

import type { OscillatorConfig } from '@api/oscillatorApi'
import useOscillatorApi from '@api/oscillatorApi'
import './App.css'

// const audioContext = new AudioContext();

function App() {

  const [oscillators, setOscillators] = useState<OscillatorConfig[]>([]);
  const [logicBlocks, setLogicBlocks] = useState<LogicBlockConfig[]>([]);
  const wsUrl = import.meta.env.DEV ? 'https://lunette.local/ws' : '/ws';

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioEngineStarted, setAudioEngineStarted] = useState(false);
  const { audioWorkletNode } = useWebSocketAudioInput(audioContext, wsUrl);
  const { reverbAlgoNode, setReverbAlgoParameters } = useReverbAlgo(audioContext);

  const { getOscillators, updateOscillator } = useOscillatorApi();
  const { getLogicBlocks, updateLogicBlock } = useLogicBlockApi();


  useEffect(() => {
    (async () => {
      const oscillators = await getOscillators();
      if (oscillators.length > 0) {
        setOscillators(oscillators);
      }

      const logics = await getLogicBlocks();
      console.log('App logics', logics);

      // const dummyLogics = [
      //   {
      //     logic_block_id: 0,
      //     operation_type: "LOGICAL_OP_AND",
      //     input1_id: "0",
      //     input1_type: "INPUT_TYPE_OSCILLATOR",
      //     input2_id: "1",
      //     input2_type: "INPUT_TYPE_OSCILLATOR"
      //   },
      //   {
      //     logic_block_id: 1,
      //     operation_type: "LOGICAL_OP_OR",
      //     input1_id: "1",
      //     input1_type: "INPUT_TYPE_OSCILLATOR",
      //     input2_id: "0",
      //     input2_type: "INPUT_TYPE_OSCILLATOR"
      //   },
      //   {
      //     logic_block_id: 2,
      //     operation_type: "LOGICAL_OP_XOR",
      //     input1_id: "0",
      //     input1_type: "INPUT_TYPE_OSCILLATOR",
      //     input2_id: "0",
      //     input2_type: "INPUT_TYPE_OSCILLATOR"
      //   },
      // ]

      // console.log('App dummyLogics', dummyLogics);

      setLogicBlocks(logics);
    })()
  }, []);

  const setValueBlock = (config: LogicBlockConfig) => {

    const index = config.logic_block_id;
    const newLogicBlocks = [...logicBlocks];
    newLogicBlocks[index] = config;
    console.log('App setValueBlock newLogicBlocks', config, newLogicBlocks);
    setLogicBlocks(newLogicBlocks);
    updateLogicBlock(config);
    // console.log('setValueBlock', config);
  }

  useEffect(() => {
    if (audioEngineStarted && reverbAlgoNode) {
      setReverbAlgoParameters({
        delayTime1: 0.90,
        delayTime2: 0.60,
        allpassFreq1: 777,
        allpassFreq2: 888,
        allpassFreq3: 999,
        allpassFreq4: 666,
        decayTime: 20.0,
        damping: 12000,
        wetDryMix: 0.99
      });
    }
  }, [audioEngineStarted, reverbAlgoNode]);

  useEffect(() => {
    console.log('audioEngineStarted', audioEngineStarted);
    if (audioEngineStarted) {
      // audioWorkletNode.connect(reverbNode);
      const audioContextRef = new AudioContext();
      setAudioContext(audioContextRef);
      // audioWorkletNode.connect(audioContextRef.destination);
      // console.log('audioWorkletNode connected to audioContext.destination');
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

  // useEffect(() => {
  //   if (audioEngineStarted && reverbNode) {
  //     reverbNode.connect(audioContext.destination);
  //   }
  // }, [audioEngineStarted, reverbNode]);

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
        <OscillatorControl
          config={oscillators[0]}
          showLabel={true}
          onChange={(frequency) => {
            updateOscillator({
              oscillator_id: 0,
              frequency: frequency,
              amplitude: 1.0,
            });
          }} />
        <OscillatorControl
          config={oscillators[1]}
          onChange={(frequency) => {
            updateOscillator({
              oscillator_id: 1,
              frequency: frequency,
              amplitude: 1.0,
            });
          }} />
        <OscillatorControl
          config={oscillators[2]}
          onChange={(frequency) => {
            updateOscillator({
              oscillator_id: 2,
              frequency: frequency,
              amplitude: 1.0,
            });
          }} />
        <OscillatorControl
          config={oscillators[3]}
          onChange={(frequency) => {
            updateOscillator({
              oscillator_id: 3,
              frequency: frequency,
              amplitude: 1.0,
            });
          }} />
      </div>

      <div className="content-block">
        <div className="cols-2">
          <AlgorithmBlock title="LOP 1" id={0} onBlockChange={setValueBlock}
            disabled={!audioEngineStarted}
            config={logicBlocks[0]}
          />
          <AlgorithmBlock title="LOP 2" id={1} onBlockChange={setValueBlock}
            disabled={!audioEngineStarted}
            config={logicBlocks[1]}
          />
        </div>
        <div className="cols-2">
          <AlgorithmBlock title="LOP 3" id={2} onBlockChange={setValueBlock}
            disabled={!audioEngineStarted}
            config={logicBlocks[2]}
          />
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
