import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function UploadBacklogModal({
  isOpen,
  onClose,
  clientId,
  clientName,
}) {
  const axios = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);

  const { mutate: uploadBacklog, isPending } = useMutation({
    mutationFn: (formData) =>
      axios.post("/payout-names/admin/upload-backlog", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Backlog names uploaded successfully!");
      setUploadReport(res?.data?.report || null);
      queryClient.invalidateQueries(["payout-names", clientId]);
      queryClient.invalidateQueries(["admin-payout-names"]);
      queryClient.invalidateQueries(["client", clientId]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to upload backlog names");
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setUploadReport(null);
    setIsDragging(false);
    onClose();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split(".").pop().toLowerCase();
      if (["csv", "xlsx", "xls"].includes(ext)) {
        setFile(selected);
        setUploadReport(null);
      } else {
        toast.error("Please upload a CSV or Excel (.xlsx, .xls) file");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split(".").pop().toLowerCase();
      if (["csv", "xlsx", "xls"].includes(ext)) {
        setFile(droppedFile);
        setUploadReport(null);
      } else {
        toast.error("Please upload a CSV or Excel (.xlsx, .xls) file");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    uploadBacklog(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <CloudArrowUpIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Upload Backlog Payout Names
                </h3>
                <p className="text-xs text-gray-500">
                  Allocating for client:{" "}
                  <span className="font-semibold text-purple-700">{clientName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Information Banner */}
            <div className="rounded-xl bg-purple-50 p-4 border border-purple-200 flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-purple-900 leading-relaxed">
                <p className="font-semibold">How Backlog Names Work:</p>
                <p className="mt-1">
                  Backlog names are pre-existing names that were provided to the client before onboarding.
                  They are created with <span className="font-mono bg-purple-100 px-1 rounded">status: claimed</span> and allocated to this client.
                </p>
                <p className="mt-1 font-semibold text-purple-950">
                  🔒 The client CANNOT view them in their portal until a payment is uploaded and matched to them.
                </p>
              </div>
            </div>

            {/* Upload Area or Results */}
            {!uploadReport ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? "border-purple-500 bg-purple-50 scale-[1.01]"
                      : "border-gray-300 hover:border-purple-400 bg-gray-50/50"
                  }`}
                >
                  <input
                    type="file"
                    id="backlog-file-input"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 truncate">
                        <DocumentTextIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                        <div className="text-left truncate">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="backlog-file-input"
                      className="cursor-pointer block space-y-2"
                    >
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-purple-600 hover:text-purple-500">
                          Click to browse
                        </span>{" "}
                        or drag and drop your file here
                      </div>
                      <p className="text-xs text-gray-400">
                        Supports CSV, Excel (.xlsx, .xls) with columns:{" "}
                        <span className="font-mono text-gray-600 font-semibold">Name, Routing Number, Account Number</span>
                      </p>
                    </label>
                  )}
                </div>

                {/* Sample Template & Format Info */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href="data:text/csv;charset=utf-8,Name,Routing Number,Account Number%0ABacklog Name 1,123456789,987654321%0ABacklog Name 2,987654321,123456789"
                    download="sample_backlog_payout_names.csv"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Download Sample Template (.CSV)
                  </a>
                  <span className="text-gray-400">Target: Main Account (Self)</span>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !file}
                    className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                  >
                    {isPending ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Uploading Backlog...</span>
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-4 w-4" />
                        <span>Upload Backlog Names</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Report Card after upload */
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3 text-emerald-600 font-bold">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span>Upload Completed</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500">Processed</p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">
                        {uploadReport.totalProcessed || 0}
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 shadow-sm">
                      <p className="text-xs text-emerald-700 font-medium">Added</p>
                      <p className="text-xl font-bold text-emerald-700 mt-0.5">
                        {uploadReport.added || 0}
                      </p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm">
                      <p className="text-xs text-amber-700 font-medium">Duplicates / Skipped</p>
                      <p className="text-xl font-bold text-amber-700 mt-0.5">
                        {uploadReport.duplicates || 0}
                      </p>
                    </div>
                  </div>

                  {uploadReport.errors && uploadReport.errors.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-700 mb-2">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span>Upload Notes & Duplicate Details:</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto bg-white p-2.5 rounded border border-gray-200 text-xs text-gray-600 space-y-1 font-mono">
                        {uploadReport.errors.map((err, i) => (
                          <div key={i} className="text-red-600">
                            • {err}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setUploadReport(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    Upload Another File
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
