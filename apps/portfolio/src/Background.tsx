
import { useState } from 'react';
import './Background.css';

const Background = () => {

  function decideTime() {
  const time = new Date().getHours()
    if (time < 18) { 
      return true
    } 
    return false
  }


  const [isDay, setIsDay] = useState(decideTime);

  const toggleDayNight = () => {
    setIsDay(!isDay);
  };

  return (
    <div>
      <div className={"app-container " + (isDay ? "" : "night")}>
        <div className="clouds" />
        <div className={"sphear " + (isDay ? "sun" : "moon")} onClick={() => toggleDayNight()} 
          >
            Click me
          </div>
    </div>
    </div>
  
  );
};

export default Background;
