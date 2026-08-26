import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import { CurrencyDollarIcon, BanknotesIcon, CheckCircleIcon, CalculatorIcon } from '@heroicons/react/24/outline';

export default function ClientDashboard() {
  const axios = useAxiosPrivate();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['client-dashboard-stats'],
    queryFn: () => axios.get('/users/dashboard/stats')
  });

  const stats = statsData?.data?.data;
  
  // Calculator State
  const [calcAmount, setCalcAmount] = useState('');
  const [calcCurrency, setCalcCurrency] = useState('USD');
  
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  const totalReceivedUSD = stats?.totalReceivedUSD || 0;
  const totalMaturedUSD = stats?.totalMaturedUSD || 0;
  const totalPaidUSD = stats?.totalPaidUSD || 0;
  
  const feePercentage = stats?.feePercentage || 0;
  const usdBuyPrice = stats?.usdBuyPrice || 1;
  const usdSellPrice = stats?.usdSellPrice || 1;

  // Calculator Logic
  const inputAmount = parseFloat(calcAmount) || 0;
  const calcFeeAmount = (inputAmount * feePercentage) / 100;
  const calcNetAmount = inputAmount - calcFeeAmount;
  
  let finalCalculatedAmount = 0;
  if (calcCurrency === 'KES') {
    finalCalculatedAmount = calcNetAmount * usdBuyPrice;
  } else if (calcCurrency === 'USD') {
    finalCalculatedAmount = (calcNetAmount * usdBuyPrice) / usdSellPrice;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-gray-500">Here's an overview of your payout names and expected balances.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Received (Waiting Maturity)</dt>
                <dd className="text-2xl font-bold text-gray-900">${totalReceivedUSD.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Matured (Ready for Payout)</dt>
                <dd className="text-2xl font-bold text-green-600">${totalMaturedUSD.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Paid Out</dt>
                <dd className="text-2xl font-bold text-gray-900">${totalPaidUSD.toFixed(2)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Calculator */}
      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <CalculatorIcon className="h-6 w-6 text-primary mr-3" />
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Payout Expectation Calculator</h3>
            <p className="text-sm text-gray-500">See exactly what you will receive in your bank based on your custom rates.</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Gross USD Amount</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                  placeholder="e.g. 1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: You can enter your "Total Matured" balance here to see what you'll get.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Account Currency</label>
              <select
                value={calcCurrency}
                onChange={(e) => setCalcCurrency(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="USD">USD Account (e.g. Crypto, USD Bank)</option>
                <option value="KES">KES Account (e.g. M-Pesa, KES Bank)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex flex-col justify-center">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Calculation Breakdown</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Amount:</span>
                <span className="font-medium text-gray-900">${inputAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Fee Deduction ({feePercentage}%):</span>
                <span>-${calcFeeAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
                <span>Net Amount (USD):</span>
                <span>${calcNetAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 pb-2 border-b border-gray-200">
                <span>Your Applied Rates:</span>
                <span>{calcCurrency === 'KES' ? `Buy: ${usdBuyPrice}` : `Buy: ${usdBuyPrice} / Sell: ${usdSellPrice}`}</span>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-blue-800 mb-1 uppercase font-semibold tracking-wide">You Will Receive</p>
                <p className="text-3xl font-bold text-blue-900">
                  {calcCurrency === 'KES' ? 'KES ' : '$'}
                  {finalCalculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
