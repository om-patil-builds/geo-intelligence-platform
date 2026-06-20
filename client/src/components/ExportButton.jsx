import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import placeService from '../services/placeService';


const ExportButton = ({ filters = {} }) => {
  const handleExportCsv = () => {
    const url = placeService.getExportCsvUrl(filters);
    window.open(url, '_blank');
  };

  const handleExportExcel = () => {
    const url = placeService.getExportExcelUrl(filters);
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl">
          <Download className="w-5 h-5" />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            Export Intelligence Data
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download current search results directly as spreadsheet files.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={handleExportCsv}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>
    </div>
  );
};

export default ExportButton;
