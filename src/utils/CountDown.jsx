import React from "react";
import Countdown from "react-countdown";

function CountDown({ date }) {

 
  const Completionist = () => (
    <span className="text-gray-600">No time remaining!</span>
  );


  // Renderer callback with condition
  const renderer = ({days, hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      return <Completionist />;
    } else {
      // Render a countdown
      return (
        <span className="bg-gray-400 rounded px-3 py-1 ">
         {days}d:{hours}h:{minutes}:{seconds}
        </span>
      );
    }
  };

  function isDateValid(dateStr) {
    return !isNaN(new Date(dateStr));
  }

  return (
    <div >
      {!isDateValid(date) ? (
        <span className="text-gray-600" >Invalid date</span>
      ) : (
        <Countdown date={date} renderer={renderer} />
      )}
    </div>
  );
}

export default CountDown;
