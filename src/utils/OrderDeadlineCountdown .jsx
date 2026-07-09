import React from 'react';
import Countdown from 'react-countdown';

const OrderDeadlineCountdown = ({ deadline }) => {
    // Renderer function to customize the countdown display
    const renderer = ({ days, hours, minutes }) => {
        return (
            <span className='px-2 py-1 text-dark'>
                {days > 0 && (
                    <span className='font-bold'>{days}d </span>
                )}
                <span className='font-bold'>{hours}h </span>
                <span className='font-bold'>{minutes}m </span>
            </span>
        );
    };

    return <Countdown date={deadline} renderer={renderer} />;
};

export default OrderDeadlineCountdown;
