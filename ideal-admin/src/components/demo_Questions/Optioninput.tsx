// import { useState } from 'react';
// import MathPreview from '../MathPreview';
// import type { OptionType, Option } from './types';

// interface OptionInputProps {
//   option: Option;
//   index: number;
//   isCorrect: boolean;
//   onCorrectChange: (id: string) => void;
//   onChange: (index: number, value: string, type: OptionType) => void;
//   onRemove: (index: number) => void;
//   canRemove: boolean;
// }

// const OptionInput = ({
//   option,
//   index,
//   isCorrect,
//   onCorrectChange,
//   onChange,
//   onRemove,
//   canRemove,
// }: OptionInputProps) => {
//   const [inputType, setInputType] = useState<any>(option.type);
//   const [showPreview, setShowPreview] = useState(false);

//   const handleTypeChange = (type: OptionType) => {
//     setInputType(type);
//     onChange(index, option.answer, type);
//   };

//   const handleValueChange = (value: string) => {
//     onChange(index, value, inputType);
//   };

//   return (
//     <div
//       className={`p-4 rounded-xl border-2 transition-all ${
//         isCorrect
//           ? 'bg-green-50 border-green-400'
//           : 'bg-gray-50 border-gray-200 hover:border-gray-300'
//       }`}>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-3">
//         <div className="flex items-center gap-3">
//           <label className="flex items-center cursor-pointer group">
//             <input
//               type="radio"
//               name="correctAnswer"
//               checked={isCorrect}
//               onChange={() => onCorrectChange(option.id)}
//               className="w-5 h-5 text-green-600 border-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer"
//             />
//             <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-green-600">
//               Correct Answer
//             </span>
//           </label>

//           <span className="px-3 py-1 bg-white rounded-lg font-bold text-gray-700 border border-gray-300">
//             {option.id}
//           </span>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             type="button"
//             onClick={() => setShowPreview(!showPreview)}
//             className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
//             title="Toggle Preview">
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24">
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//               />
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//               />
//             </svg>
//           </button>

//           {canRemove && (
//             <button
//               type="button"
//               onClick={() => onRemove(index)}
//               className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
//               title="Remove Option">
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                 />
//               </svg>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Type Selector */}
//       <div className="flex gap-2 mb-3">
//         <button
//           type="button"
//           onClick={() => handleTypeChange('LATEX')}
//           className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
//             inputType === 'LATEX'
//               ? 'bg-indigo-600 text-white shadow-sm'
//               : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
//           }`}>
//           LaTeX
//         </button>
//         <button
//           type="button"
//           onClick={() => handleTypeChange('NORMAL')}
//           className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
//             inputType === 'NORMAL'
//               ? 'bg-indigo-600 text-white shadow-sm'
//               : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
//           }`}>
//           Text
//         </button>
//       </div>

//       {/* Input Field */}
//       {inputType === 'NORMAL' ? (
//         <input
//           type="text"
//           value={option.answer}
//           onChange={(e) => handleValueChange(e.target.value)}
//           placeholder="Enter option text..."
//           className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
//         />
//       ) : (
//         <textarea
//           value={option.answer}
//           onChange={(e) => handleValueChange(e.target.value)}
//           placeholder="Enter LaTeX formula... e.g., $x^2 + y^2 = r^2$"
//           className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-mono text-sm resize-none"
//           rows={2}
//         />
//       )}

//       {/* Preview */}
//       {showPreview && option.answer && (
//         <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
//           <div className="text-xs font-semibold text-gray-500 mb-2">
//             Preview:
//           </div>
//           {inputType === 'LATEX' ? (
//             <MathPreview text="" latex={option.answer} />
//           ) : (
//             <div className="text-gray-800">{option.answer}</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OptionInput;

import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import MathPreview from '../MathPreview';
import type { OptionType, Option } from './types';

interface OptionInputProps {
  option: Option;
  index: number;
  isCorrect: boolean;
  onCorrectChange: (id: string) => void;
  onChange: (
    index: number,
    value: string,
    type: OptionType,
    imageFile?: File | null,
  ) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const OptionInput = ({
  option,
  index,
  isCorrect,
  onCorrectChange,
  onChange,
  onRemove,
  canRemove,
}: OptionInputProps) => {
  const [inputType, setInputType] = useState<OptionType>(
    option.type ?? 'LATEX',
  );
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    option.type === 'IMAGE' && option.answer ? option.answer : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when edit-mode data arrives after the initial render (async query)
  useEffect(() => {
    if (option.type) {
      setInputType(option.type);
    }
    if (option.type === 'IMAGE' && option.answer) {
      setImagePreview(option.answer); // S3 URL from existing question
    } else if (option.type !== 'IMAGE') {
      setImagePreview(null);
    }
  }, [option.type, option.answer]);

  const handleTypeChange = (type: OptionType) => {
    setInputType(type);
    // Clear previous value & image when switching type
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange(index, '', type, null);
  };

  const handleValueChange = (value: string) => {
    onChange(index, value, inputType);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Pass the filename as the answer placeholder so validation knows a file was chosen;
    // the actual File object is forwarded via the imageFile parameter.
    onChange(index, file.name, 'IMAGE', file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange(index, '', 'IMAGE', null);
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        isCorrect
          ? 'bg-green-50 border-green-400'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="correctAnswer"
              checked={isCorrect}
              onChange={() => onCorrectChange(option.id)}
              className="w-5 h-5 text-green-600 border-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-green-600">
              Correct Answer
            </span>
          </label>

          <span className="px-3 py-1 bg-white rounded-lg font-bold text-gray-700 border border-gray-300">
            {option.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {inputType !== 'IMAGE' && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title="Toggle Preview">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
              title="Remove Option">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 mb-3">
        {(['LATEX', 'NORMAL', 'IMAGE'] as OptionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              inputType === t
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}>
            {t === 'IMAGE' && <Upload className="w-3.5 h-3.5" />}
            {t === 'LATEX' ? 'LaTeX' : t === 'NORMAL' ? 'Text' : 'Image'}
          </button>
        ))}
      </div>

      {/* Input Field */}
      {inputType === 'NORMAL' && (
        <input
          type="text"
          value={option.answer}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter option text..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
        />
      )}

      {inputType === 'LATEX' && (
        <textarea
          value={option.answer}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter LaTeX formula... e.g., $x^2 + y^2 = r^2$"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-mono text-sm resize-none"
          rows={2}
        />
      )}

      {inputType === 'IMAGE' && (
        <div>
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex flex-col items-center gap-1.5 text-indigo-600">
                <Upload className="w-6 h-6" />
                <span className="font-semibold text-xs">
                  Upload option image
                </span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-indigo-200">
              <img
                src={imagePreview}
                alt={`Option ${option.id} preview`}
                className="w-full max-h-40 object-contain bg-gray-50"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="px-3 py-1.5 bg-white border-t border-indigo-100">
                <p className="text-xs text-gray-500 truncate">
                  {option.imageFile?.name ?? 'Existing image'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LaTeX/Text Preview */}
      {showPreview && inputType !== 'IMAGE' && option.answer && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
          <div className="text-xs font-semibold text-gray-500 mb-2">
            Preview:
          </div>
          {inputType === 'LATEX' ? (
            <MathPreview text="" latex={option.answer} />
          ) : (
            <div className="text-gray-800">{option.answer}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default OptionInput;
