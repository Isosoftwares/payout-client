import React from 'react';
import DailyReportView from '../../components/DailyReportView';

export default function AdminDailyReport() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Daily Financial Report
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor payments received and maturing on any date, filter by client, and download full CSV reports.
        </p>
      </div>

      <DailyReportView isAdmin={true} />
    </div>
  );
}
