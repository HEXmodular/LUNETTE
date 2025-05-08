// import viteLogo from '/vite.svg'
import './App.css'
import OscillatorControl from '@controls/oscillator-control/oscillator-control'
import LogicBlock from '@controls/logic-block/logic-block'

function App() {

  return (
    <>
              {/* <img src={viteLogo} className="logo" alt="Vite logo" /> */}
              {/* <!-- oscilator controls --> */}

              {/* <ValueControl /> */}
              <OscillatorControl />

              <LogicBlock />

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
