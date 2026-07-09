import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <p className="mt-4 text-2xl font-semibold">Unauthorized</p>
        <p className="mt-2 text-gray-600">
          You do not have permission to view this page.
        </p>
        <button
        onClick={() => navigate(-1)}
          className="mt-6 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
