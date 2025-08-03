

import { useState, useEffect } from 'react';
import API from '../api/index';

export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="p-4 max-w-md mx-auto bg-red-100 border border-red-300 rounded">
      <p className="text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
}
