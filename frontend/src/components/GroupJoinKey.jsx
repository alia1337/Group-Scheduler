import React, { useState } from "react";

const GroupJoinKey = ({ joinKey, groupName }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
    }
  };

  return (
    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
      <h4 className="text-sm font-semibold text-green-800 mb-2">Group Join Key</h4>
      <p className="text-xs text-green-700 mb-3">
        Share this key with others to invite them to "{groupName}"
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white border border-green-300 px-3 py-2 rounded text-sm font-mono text-green-800 select-all">
          {joinKey}
        </code>
        <button
          onClick={copyToClipboard}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default GroupJoinKey;