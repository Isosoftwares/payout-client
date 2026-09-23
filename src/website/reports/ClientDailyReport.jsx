import React from 'react';
import DailyReportView from '../../components/DailyReportView';

export default function ClientDailyReport() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Daily Report
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your payments received and maturing on specific dates with financial totals and CSV downloads.
        </p>
      </div>

      <DailyReportView isAdmin={false} />
    </div>
  );
}
