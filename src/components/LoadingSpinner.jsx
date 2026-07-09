import React from "react";
import {
  BeatLoader,
  PulseLoader,
  ClipLoader,
  SyncLoader,
} from "react-spinners";

// Minimal inline version
function FebwinSpinnerInline({
  size = 20,
  color = "#3264ff",
  type = "beat",
  showText = true,
}) {
  const spinnerProps = {
    color: color,
    size: size / 2,
    loading: true,
  };

  const getInlineSpinner = () => {
    switch (type) {
      case "beat":
        return <BeatLoader {...spinnerProps} margin={2} />;
      case "pulse":
        return <PulseLoader {...spinnerProps} margin={2} />;
      case "clip":
        return <ClipLoader size={size} color={color} />;
      case "sync":
        return <SyncLoader {...spinnerProps} margin={2} />;
      default:
        return <BeatLoader {...spinnerProps} margin={2} />;
    }
  };

  return (
    <div className="flex items-center justify-center space-x-3 p-3">
      {getInlineSpinner()}
    </div>
  );
}

export default FebwinSpinnerInline;
