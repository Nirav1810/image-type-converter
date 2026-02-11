'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, X, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  convertImageBatch,
  downloadFile,
  formatFileSize,
  isValidImage,
  type ImageFormat,
  type ConversionResult,
} from '@/lib/imageConverter';

interface FileWithPreview extends File {
  preview?: string;
}

export default function ImageConverter() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('webp');
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState(100);
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (!isValidImage(file)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const filesWithPreviews = validFiles.map((file) => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setFiles((prev) => [...prev, ...filesWithPreviews]);
      setResults([]); // Clear previous results
      toast.success(`${validFiles.length} image(s) added`);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please add images first');
      return;
    }

    setIsConverting(true);
    setProgress({ current: 0, total: files.length });

    try {
      const conversionResults = await convertImageBatch(
        files,
        {
          format: selectedFormat,
          quality: quality / 100,
          scale: scale / 100,
        },
        (current, total) => {
          setProgress({ current, total });
        }
      );

      if (conversionResults.length === 0) {
        toast.error('No images were converted');
        return;
      }

      setResults(conversionResults);
      toast.success(`${conversionResults.length} image(s) converted successfully`);
    } catch (error) {
      toast.error('Conversion failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const result of results) {
      downloadFile(result.blob, result.filename);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    toast.success('All files downloaded');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(237, 100, 48, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(237, 100, 48, 0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .float { animation: float 3s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2s infinite; }
        
        .dropzone-active {
          border-color: var(--primary) !important;
          background-color: rgba(237, 100, 48, 0.05) !important;
        }
      `}</style>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-primary float" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Image Converter</h1>
            <Zap className="w-8 h-8 text-primary float" style={{ animationDelay: '1s' }} />
          </div>
          <p className="text-muted-foreground text-lg">Convert images instantly • No uploads • 100% private</p>
        </div>

        {/* Main Card */}
        <Card className="bg-card border-border shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-card to-background border-b border-border">
            <CardTitle className="text-foreground">Upload & Convert</CardTitle>
            <CardDescription className="text-muted-foreground">
              Drop images here or click to browse. Zero server interaction.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${dragActive
                ? 'dropzone-active'
                : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card'
                }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="flex justify-center mb-4">
                  <Upload className={`w-12 h-12 transition-all duration-300 ${dragActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-foreground font-semibold text-lg mb-1">Drag images here or click to select</p>
                <p className="text-muted-foreground text-sm">Supports JPG, PNG, WEBP, GIF</p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">Selected Files</h3>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-mono">{files.length}</span>
                </div>
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-card border border-border/50 p-3 rounded-lg hover:border-border transition-colors animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {file.preview && (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onLoad={() => {
                                // Optional: You could revoke here if you only need it for initial render, 
                                // but keeping it for list view is better.
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-foreground text-sm truncate font-medium max-w-[200px]">{file.name}</p>
                          <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="ml-3 text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-full"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options Panel */}
            <div className="grid md:grid-cols-2 gap-6 bg-card border border-border/50 p-6 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="text-foreground text-sm font-semibold block mb-3">Output Format</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as ImageFormat)}
                    disabled={isConverting}
                    className="w-full bg-background border border-border text-foreground rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="webp">WEBP (Modern, Best Compression)</option>
                    <option value="jpeg">JPEG (Universal Compatibility)</option>
                    <option value="png">PNG (Lossless, Scale to reduce size)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-foreground text-sm font-semibold">Scale</label>
                    <span className="text-primary text-xs font-mono bg-primary/20 px-2 py-1 rounded">{scale}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    disabled={isConverting}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-muted-foreground text-xs mt-1">Reduce image dimensions to save space</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-sm font-semibold ${selectedFormat === 'png' ? 'text-muted-foreground' : 'text-foreground'}`}>Quality</label>
                  <span className={`text-xs font-mono px-2 py-1 rounded ${selectedFormat === 'png' ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}>{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  disabled={isConverting || selectedFormat === 'png'}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${selectedFormat === 'png' ? 'bg-muted accent-muted-foreground cursor-not-allowed' : 'bg-border accent-primary'}`}
                />
                <p className="text-muted-foreground text-xs mt-1">
                  {selectedFormat === 'png'
                    ? 'Not available for PNG (Lossless format). Use Scale instead.'
                    : 'Lower quality reduces file size significantly'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleConvert}
                disabled={files.length === 0 || isConverting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-auto"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting... ({progress.current}/{progress.total})
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Convert Images
                  </>
                )}
              </Button>

              {results.length > 0 && (
                <Button
                  onClick={handleDownloadAll}
                  disabled={isConverting}
                  variant="outline"
                  className="flex-1 border-border hover:bg-card text-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="text-foreground font-semibold">Conversion Complete</h3>
                </div>
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-card border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg hover:border-primary/40 transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium truncate">{result.filename}</p>
                        <p className="text-primary text-xs">{formatFileSize(result.size)}</p>
                      </div>
                      <Button
                        onClick={() => downloadFile(result.blob, result.filename)}
                        size="sm"
                        className="ml-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-8 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Powered by Canvas API • No tracking • No analytics
        </p>
      </div>
    </div>
  );
}
