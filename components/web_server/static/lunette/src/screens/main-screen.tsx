import { useEffect, useState } from 'react'
import OscillatorControl from '@controls/oscillator-control/oscillator-control'
import AlgorithmBlock from '@algorithm/algorithm-4o3l/algorithm-block'
import MixerBlock from '@controls/mixer-block/mixer-block'
import useLogicBlockApi, { type LogicBlockConfig } from '@api/logicBlockApi'
import type { OscillatorConfig } from '@api/oscillatorApi'
import useOscillatorApi from '@api/oscillatorApi'

interface MainScreenProps {
  audioEngineStarted: boolean;
}

const MainScreen: React.FC<MainScreenProps> = ({ audioEngineStarted }) => {
  const [oscillators, setOscillators] = useState<OscillatorConfig[]>([]);
  const [logicBlocks, setLogicBlocks] = useState<LogicBlockConfig[]>([]);

  const { getOscillators, updateOscillator } = useOscillatorApi();
  const { getLogicBlocks, updateLogicBlock } = useLogicBlockApi();

  useEffect(() => {
    (async () => {
      const oscillators = await getOscillators();
      if (oscillators.length > 0) {
        setOscillators(oscillators);
      }

      const logics = await getLogicBlocks();
      console.log('MainScreen logics', logics);
      setLogicBlocks(logics);
    })()
  }, []);

  const setValueBlock = (config: LogicBlockConfig) => {
    const index = config.logic_block_id;
    const newLogicBlocks = [...logicBlocks];
    newLogicBlocks[index] = config;
    console.log('MainScreen setValueBlock newLogicBlocks', config, newLogicBlocks);
    setLogicBlocks(newLogicBlocks);
    updateLogicBlock(config);
  }

  return (
    <div>
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
    </div>
  )
}

export default MainScreen
