import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Copy, RefreshCw, X, Check, Trash2, Zap, BookOpen, Calculator, MessageSquarePlus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { generateMathProblem, GenerationMode } from './services/geminiService';
import MathRenderer from './components/MathRenderer';
import { UploadedFile, FileType } from './types';

// Helper functions moved outside component to avoid dependency issues
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const stripBase64Prefix = (base64: string): string => {
  return base64.split(',')[1];
};

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [problemCount, setProblemCount] = useState<number>(1);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setGeneratedContent("");
    setZoomLevel(1); // Reset zoom on new file

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Định dạng file không hỗ trợ. Vui lòng chọn PNG, JPG hoặc PDF.");
      return;
    }

    try {
      const base64Data = await convertFileToBase64(file);
      const isPdf = file.type === 'application/pdf';
      
      setUploadedFile({
        file,
        previewUrl: URL.createObjectURL(file), // Generate URL for both Image and PDF
        base64Data: stripBase64Prefix(base64Data),
        mimeType: file.type,
        type: isPdf ? FileType.PDF : FileType.IMAGE
      });
    } catch (err) {
      setError("Lỗi khi đọc file. Vui lòng thử lại.");
    }
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  }, [processFile]);

  // Handle Paste Event (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If user is focusing on the prompt textarea, do not intercept paste
      if (document.activeElement instanceof HTMLTextAreaElement) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return; // Only process the first image found
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processFile]);

  const handleClearFile = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setGeneratedContent("");
    setError(null);
    setZoomLevel(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleGenerate = async (mode: GenerationMode) => {
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Pass the problemCount, unless mode is 'original' (which is always 1)
      const count = mode === 'original' ? 1 : problemCount;
      const result = await generateMathProblem(uploadedFile.base64Data, uploadedFile.mimeType, mode, count, userPrompt);
      setGeneratedContent(result);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToWord = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-900 tracking-tight mb-2">
            Bồi dưỡng học sinh giỏi toán_Trung Hiếu
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tải lên hoặc dán (Ctrl+V) bài toán của bạn, AI sẽ hỗ trợ giải chi tiết hoặc tạo đề luyện tập.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Upload Bài Toán
                </h2>
              </div>
              
              <div className="p-6">
                {!uploadedFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                  >
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-slate-900 font-medium mb-1">Click để tải hoặc dán (Ctrl+V) ảnh</p>
                    <p className="text-slate-500 text-sm">PNG, JPG, PDF (Max 10MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
                    
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-2 bg-white border-b border-slate-200 z-10 shadow-sm">
                        <div className="flex items-center gap-1">
                            <button onClick={handleZoomOut} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" title="Thu nhỏ">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                             <span className="text-xs font-medium text-slate-500 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600" title="Phóng to">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button onClick={handleResetZoom} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 ml-1" title="Đặt lại kích thước">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md hover:bg-slate-100 text-indigo-600 font-medium text-xs flex items-center gap-1">
                                <Upload className="w-3.5 h-3.5" /> Đổi file
                            </button>
                            <button onClick={handleClearFile} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Xóa file">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content Preview with Scroll and Zoom */}
                    <div className="relative overflow-auto bg-slate-100 flex items-start justify-center p-4 h-96 custom-scrollbar">
                        <div 
                            style={{ 
                                transform: `scale(${zoomLevel})`, 
                                transformOrigin: 'top center',
                                transition: 'transform 0.1s ease-out'
                            }}
                            className="shadow-md"
                        >
                            {uploadedFile.type === FileType.IMAGE && uploadedFile.previewUrl ? (
                                <img 
                                src={uploadedFile.previewUrl} 
                                alt="Preview" 
                                className="max-w-full rounded bg-white" 
                                />
                            ) : uploadedFile.type === FileType.PDF && uploadedFile.previewUrl ? (
                                <iframe 
                                    src={uploadedFile.previewUrl}
                                    title="PDF Preview"
                                    className="w-[600px] h-[800px] bg-white rounded"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-10 bg-white rounded">
                                <FileText className="w-16 h-16 text-red-500 mb-2" />
                                <span className="text-slate-700 font-medium">{uploadedFile.file.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileChange}
                />

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                     <span>⚠️</span> {error}
                  </div>
                )}

                <div className="mt-6 space-y-4">
                   {/* Custom Prompt Input */}
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
                      <MessageSquarePlus className="w-5 h-5 text-indigo-500" />
                      Yêu cầu bổ sung (Prompt):
                    </div>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Ví dụ: Chỉ viết đáp án, không cần lời giải chi tiết. Hoặc: Giải bằng cách lập phương trình..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px]"
                    />
                  </div>

                  {/* Quantity Input */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calculator className="w-5 h-5 text-indigo-500" />
                      Số lượng bài:
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="10"
                        value={problemCount}
                        onChange={(e) => setProblemCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">(Max 10)</span>
                    </div>
                  </div>

                  {/* Solve Original - Full Width */}
                  <button
                    onClick={() => handleGenerate('original')}
                    disabled={!uploadedFile || isLoading}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all
                      ${!uploadedFile || isLoading 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                      }`}
                  >
                     {isLoading ? <BookOpen className="w-5 h-5 animate-pulse" /> : <BookOpen className="w-5 h-5" />}
                    Giải Chi Tiết Bài Gốc
                  </button>
                  
                  {/* Divider */}
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Hoặc tạo đề luyện tập</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleGenerate('similar')}
                      disabled={!uploadedFile || isLoading}
                      className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all
                        ${!uploadedFile || isLoading 
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                        }`}
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      Tạo Bài Tương Tự
                    </button>

                    <button
                      onClick={() => handleGenerate('advanced')}
                      disabled={!uploadedFile || isLoading}
                      className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-violet-200 flex items-center justify-center gap-2 transition-all
                        ${!uploadedFile || isLoading 
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : 'bg-violet-600 hover:bg-violet-700 active:scale-[0.98]'
                        }`}
                    >
                      <Zap className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                      Tạo Bài Nâng Cao
                    </button>
                  </div>
                </div>
                {isLoading && (
                  <p className="text-center text-sm text-slate-500 mt-3 animate-pulse">
                    AI đang phân tích và giải toán...
                  </p>
                )}
              </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-indigo-100 shadow-xl">
              <h3 className="font-bold text-white text-lg mb-2">Hướng dẫn</h3>
              <ul className="space-y-2 text-sm text-indigo-200">
                <li className="flex gap-2">
                  <span className="bg-indigo-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                  Tải lên ảnh/PDF hoặc dán ảnh (Ctrl+V).
                </li>
                <li className="flex gap-2">
                  <span className="bg-indigo-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                  Nhập yêu cầu cụ thể (nếu có) vào ô Prompt.
                </li>
                <li className="flex gap-2">
                  <span className="bg-indigo-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                  Chọn chế độ giải hoặc tạo bài tập để bắt đầu.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Result Display */}
          <div className="flex flex-col h-full">
             <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex-grow flex flex-col overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Kết Quả
                  </h2>
                  {generatedContent && (
                    <button
                      onClick={handleCopyToWord}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        copySuccess 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess ? 'Đã Copy!' : 'Copy sang Word'}
                    </button>
                  )}
                </div>

                <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                  {!generatedContent && !isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">✨</span>
                      </div>
                      <p className="text-center">Kết quả sẽ hiển thị ở đây</p>
                    </div>
                  ) : isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                       <div className="relative w-20 h-20">
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                       </div>
                       <p className="text-indigo-600 font-medium animate-pulse">AI đang suy nghĩ...</p>
                    </div>
                  ) : (
                    <div className="bg-white">
                      <MathRenderer content={generatedContent} />
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;