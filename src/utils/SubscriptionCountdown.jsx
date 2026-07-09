import React from "react";
import Countdown from "react-countdown";

const SubscriptionCountdown = ({ subscription }) => {
  const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };

  const CompletionMessage = () => <span className="text-red-500">Expired</span>;

  const countdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return <CompletionMessage />;
    } else {
      return (
        <div className="bg-[#dedce4] py-4 rounded px-3 text-dark text-2xl">
          {days}d {hours}h {minutes}m {seconds}s
        </div>
      );
    }
  };

  const expiryDate = subscription?.expiryDate;

  return (
    <div className="">
      {isValidDate(expiryDate) ? (
        <Countdown date={expiryDate} renderer={countdownRenderer} />
      ) : (
        <span className="text-gray-600">Invalid date</span>
      )}
    </div>
  );
};

export default SubscriptionCountdown;
