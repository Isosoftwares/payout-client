import React, { useState } from "react";
import QRCode from "qrcode.react";
import btcIcon from "../../assets/graphics/btc.png";
import solIcon from "../../assets/graphics/sol.svg";
import liteIcon from "../../assets/graphics/lite.png";
import usdtIcon from "../../assets/graphics/usdc.png";
import { Alert } from "@mantine/core";
import { 
  ClipboardDocumentIcon, 
  CheckIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

function QrCodeGenerator({ data }) {
  //copy to clipboard
  const [copyText, setCopyText] = useState("Copy");
  const [copyAmount, setCopyAmount] = useState("Copy");

  const handleCopy = () => {
    navigator.clipboard.writeText(data?.pay_address);
    setCopyText("Copied!");
    setTimeout(() => {
      setCopyText("Copy");
    }, 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(data?.pay_amount);
    setCopyAmount("Copied!");
    setTimeout(() => {
      setCopyAmount("Copy");
    }, 2000);
  };

  const iconObj = {
    btc: btcIcon,
    usdterc20: usdtIcon,
    ltc: liteIcon,
    sol: solIcon,
  };

  const currencyname = (name) => {
    if (name === "ltc") {
      return "litecoin";
    } else if (name === "btc") {
      return "bitcoin";
    } else if (name === "sol") {
      return "Solana";
    } else if (name === "usdterc20") {
      return 'tether'
    } else {
      return "name";
    }
  };

  const coinURI = `${currencyname(data?.pay_currency)}:${
    data?.pay_address
  }?amount=${data?.pay_amount}`;
  const qrCodeSize = 200;
  const iconSize = 40;

  // Style for the icon image overlay
  const iconStyle = {
    position: "absolute",
    top: `calc(50% - ${iconSize / 2}px)`,
    left: `calc(50% - ${iconSize / 2}px)`,
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: "50%",
    backgroundColor: "white",
    zIndex: 100,
    border: "2px solid #f3f4f6",
  };

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* USDT ERC20 Warning */}
      {data?.pay_currency === 'usdterc20' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-800 font-medium mb-1">Important Notice</h4>
              <p className="text-amber-700 text-sm">
                Only send USDT to this address from ERC20 network. Don't send USDT from other
                networks or it will result in a loss of funds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div style={{ position: "relative", display: "inline-block" }}>
            <QRCode 
              size={qrCodeSize} 
              value={coinURI}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
            <img 
              src={iconObj[data?.pay_currency]} 
              alt="Currency Icon" 
              style={iconStyle} 
            />
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4">
        {/* Address Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase">
              {data?.pay_currency} Address
            </h3>
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {copyText === "Copied!" ? (
                <>
                  <CheckIcon className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-sm text-gray-900 font-mono break-all">
              {data?.pay_address}
            </p>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Amount to Send
            </h3>
            <button
              onClick={handleCopyAmount}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {copyAmount === "Copied!" ? (
                <>
                  <CheckIcon className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-lg font-semibold text-gray-900">
              {data?.pay_amount} {data?.pay_currency?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-blue-900 font-medium mb-2">Payment Instructions</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Send exactly the amount shown above</li>
            <li>• Use the provided address only</li>
            <li>• Make only one transaction</li>
            <li>• Allow 10-30 minutes for confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default QrCodeGenerator;