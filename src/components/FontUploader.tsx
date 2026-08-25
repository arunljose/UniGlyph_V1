/**
 * OTF Font Ingestion & Parsing Component
 */
import React, { useRef, useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { FontMetadata } from '../types/conlang';
import { parseFontBuffer, createSampleUniGlyphDataset, ParseFontResult } from '../utils/fontParser';

interface FontUploaderProps {
  fontMetadata: FontMetadata | null;
  glyphCount: number;
  onFontLoaded: (result: ParseFontResult) => void;
}

export const FontUploader: React.FC<FontUploaderProps> = ({
  fontMetadata,
  glyphCount,
  onFontLoaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.otf') && !nameLower.endsWith('.ttf') && !nameLower.endsWith('.woff')) {
      setErrorMessage('Please upload a valid OpenType (.otf) or TrueType (.ttf) font file.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await parseFontBuffer(arrayBuffer, file.name, file.size);
      onFontLoaded(result);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Error extracting glyphs from font');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemoFont = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const demoResult = createSampleUniGlyphDataset();
      onFontLoaded(demoResult);
      setIsLoading(false);
    }, 250);
  };

  return (
    <div id="font-uploader-container" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold">1</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#E0E0E0] tracking-tight">OTF Font Ingestion & Extraction Engine</h2>
          </div>
          <p className="text-xs text-[#888] mt-1">
            Ingest OpenType (<code className="font-mono text-xs bg-[#1C1C21] px-1.5 py-0.5 rounded text-indigo-300 border border-[#2A2A2E]">.otf</code>) or TrueType fonts. Opentype.js extracts every vector path and glyph bounding box.
          </p>
        </div>

        <button
          id="btn-load-demo-font"
          type="button"
          onClick={handleLoadDemoFont}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 rounded border border-indigo-500/30 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Load Canonical UniGlyph Demo Font
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".otf,.ttf,.woff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div
        id="font-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20'
            : 'border-[#3A3A3E] hover:border-indigo-500/60 bg-[#0A0A0C] hover:bg-[#111114]'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
              <span className="text-xs font-medium text-[#E0E0E0]">Parsing OpenType font tables & extracting vectors...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-[#1C1C21] border border-[#2A2A2E] flex items-center justify-center text-indigo-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#E0E0E0]">
                  <span className="text-indigo-400 font-semibold hover:underline">Click to browse</span> or drag and drop your <code className="font-mono text-xs bg-[#1C1C21] px-1 py-0.5 rounded text-indigo-300 border border-[#2A2A2E]">.otf</code> file here
                </p>
                <p className="text-[11px] text-[#666] mt-1">Supports OTF, TTF, and WOFF vector fonts (Opentype.js native extraction)</p>
              </div>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div id="font-error-box" className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {fontMetadata && (
        <div id="font-metadata-card" className="mt-4 p-3.5 rounded-xl bg-[#0A0A0C] border border-[#2A2A2E] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#E0E0E0] text-xs sm:text-sm">{fontMetadata.fontFamily}</span>
                <span className="px-2 py-0.5 rounded bg-[#1C1C21] border border-[#2A2A2E] text-indigo-400 font-mono text-[10px] uppercase">{fontMetadata.styleName}</span>
              </div>
              <p className="text-[#888] font-mono text-[11px] mt-0.5">
                Source: <span className="text-indigo-300">{fontMetadata.fileName}</span> • {(fontMetadata.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#888]">
            <div className="flex items-center gap-1.5 bg-[#1C1C21] px-2.5 py-1.5 rounded-md border border-[#2A2A2E]">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-[#E0E0E0]">{glyphCount}</span>
              <span className="text-[#888] text-[11px]">Glyphs Extracted</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1C1C21] px-2.5 py-1.5 rounded-md border border-[#2A2A2E] font-mono text-[10px] text-[#888]">
              <FileText className="w-3.5 h-3.5 text-[#666]" />
              <span>EM: {fontMetadata.unitsPerEm} | Asc: {fontMetadata.ascender} | Desc: {fontMetadata.descender}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
