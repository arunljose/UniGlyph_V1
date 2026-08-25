/**
 * JSON Schema Export & Import Component
 */
import React, { useState } from 'react';
import { ConlangProjectConfig, ExtractedGlyph, KeyboardKeySlot } from '../types/conlang';
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConlangProjectConfig;
  onImportConfig: (imported: ConlangProjectConfig) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  config,
  onImportConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(config, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uniglyph-phase1-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportText(text);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importText);
      if (!parsed.glyphs || !Array.isArray(parsed.glyphs)) {
        throw new Error('Invalid schema: Missing glyphs array');
      }
      onImportConfig(parsed);
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  return (
    <div
      id="export-import-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-import-modal"
        className="bg-[#111114] rounded-2xl border border-[#2A2A2E] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#E0E0E0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E] bg-[#1C1C21]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#E0E0E0] text-sm sm:text-base">UniGlyph Language Schema</h3>
              <p className="text-xs text-[#888]">Export or import your Phase 1 layout & categorization schema</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-[#E0E0E0] hover:bg-[#2A2A2E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#2A2A2E] px-6 pt-2 bg-[#0A0A0C]">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-[#888] hover:text-[#E0E0E0]'
            }`}
          >
            Export JSON Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-[#888] hover:text-[#E0E0E0]'
            }`}
          >
            Import JSON Schema
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-[#111114]">
          {activeTab === 'export' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#888]">Project Configuration JSON</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C1C21] hover:bg-[#25252B] border border-[#2A2A2E] text-[#E0E0E0] text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#888]" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    id="btn-download-json"
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-black hover:bg-slate-200 text-xs font-medium transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={jsonString}
                rows={12}
                className="w-full p-3 font-mono text-[11px] bg-[#0A0A0C] text-[#E0E0E0] rounded-xl border border-[#2A2A2E] focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-[#888] mb-1">
                  Upload .json file or paste schema string
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-[#888] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#1C1C21] file:text-[#E0E0E0] file:border file:border-[#2A2A2E] hover:file:bg-[#25252B] cursor-pointer"
                />
              </div>

              <textarea
                placeholder="Paste UniGlyph JSON configuration here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                className="w-full p-3 font-mono text-[11px] bg-[#0A0A0C] border border-[#2A2A2E] rounded-xl text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500 placeholder-[#666]"
              />

              {importError && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyImport}
                  disabled={!importText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 disabled:opacity-40 text-xs font-medium transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load & Apply Schema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
