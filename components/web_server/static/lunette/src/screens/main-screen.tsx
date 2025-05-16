import { useEffect, useState, useRef } from 'react'
import OscillatorControl from '@controls/oscillator-control/oscillator-control'
import AlgorithmBlock from '@algorithm/algorithm-4o3l/algorithm-block'
import MixerBlock from '@controls/mixer-block/mixer-block'
import useLogicBlockApi, { type LogicBlockConfig } from '@api/logicBlockApi'
import { useOscillatorContext } from '@contexts/OscillatorContext'
import './main-screen.css'

const MainScreen: React.FC = () => {
  const [logicBlocks, setLogicBlocks] = useState<LogicBlockConfig[]>([]);
  const dataFetching = useRef({ logicBlocks: false }); // to prevent multiple fetching in development mode
  const { oscillators, updateOscillator, isLoading: oscillatorsLoading } = useOscillatorContext();
  const { getLogicBlocks, updateLogicBlock } = useLogicBlockApi();

  useEffect(() => { 
    (async () => {
      if (!dataFetching.current.logicBlocks) {
        dataFetching.current.logicBlocks = true;
        const logics = await getLogicBlocks();
        setLogicBlocks(logics);
      }
    })()
  }, []);

  const setValueBlock = (config: LogicBlockConfig) => {
    const index = config.logic_block_id;
    const newLogicBlocks = [...logicBlocks];
    newLogicBlocks[index] = config;
    updateLogicBlock(config);
  }

  return (
    <div>
      <div className={`content-block ${oscillatorsLoading ? "loading-block" : ""}`}>
        {oscillators.map((oscillator, index) => (
          <OscillatorControl
            key={oscillator.oscillator_id}
            config={oscillator}
            showLabel={index === 0}
            onChange={(frequency) => {
              updateOscillator({
                oscillator_id: index,
                frequency: frequency,
                amplitude: 1.0,
              });
            }}
          />
        ))}
      </div>


      <div className={`content-block ${dataFetching.current.logicBlocks || "loading-block"}`}>
        <div className="cols-2 block-container">

          <AlgorithmBlock title="LOP 1" id={0} onBlockChange={setValueBlock}
            disabled={!logicBlocks[0]}
            config={logicBlocks[0]}
          />
          <AlgorithmBlock title="LOP 2" id={1} onBlockChange={setValueBlock}
            disabled={!logicBlocks[1]}
            config={logicBlocks[1]}
          />
        </div>
        <div className="cols-2 block-container">
          <AlgorithmBlock title="LOP 3" id={2} onBlockChange={setValueBlock}
            disabled={!logicBlocks[2]}
            config={logicBlocks[2]}
          />
          <MixerBlock id="mixer-1" title="MIXER 1" onMixerChange={() => { }} />
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
