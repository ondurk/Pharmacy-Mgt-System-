import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX } from '../../services/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Play,
  ArrowRight,
} from 'lucide-react';
import { Product, StockBatch } from '../../types';

interface ParsedRow {
  rowNum: number;
  brandName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPriceUGX: number;
  retailPriceUGX: number;
  schedule: 'otc' | 'prescription' | 'controlled';
  ndaRegNumber: string;
  status: 'valid' | 'error';
  errorMessage?: string;
}

const SAMPLE_CSV = `Brand Name,Generic Name,Batch Number,Expiry Date,Opening Quantity,Cost Price (UGX),Retail Price (UGX),Schedule,NDA Reg #
Coartem 20/120mg,Artemether Lumefantrine,CTM-2027-X1,2027-08-31,100,16000,25000,otc,NDA/MAL/2021/0411
Amoxicillin 500mg,Amoxicillin Trihydrate,AMX-2027-B2,2027-10-31,60,12000,18000,prescription,NDA/ANT/2020/0198
Paracetamol 500mg,Paracetamol,PAR-2028-01,2028-05-15,120,6000,10000,otc,NDA/ANA/2021/0088
Pethidine 50mg/ml,Pethidine Hydrochloride,PET-2027-N1,2027-12-31,20,75000,110000,controlled,NDA/CTR/2018/0014
Metformin 500mg,Metformin HCl,MET-2027-M5,2027-11-30,80,9500,16000,prescription,NDA/DIA/2020/0552
Invalid Row Example,,INVALID-LOT,not-a-date,-5,0,0,unknown,`;

export const DataImportTool: React.FC = () => {
  const { importProductsAndBatches } = useApp();

  const [rawText, setRawText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isDryRunDone, setIsDryRunDone] = useState(false);
  const [importCompleted, setImportCompleted] = useState<{
    products: number;
    batches: number;
  } | null>(null);

  const handleRunValidation = () => {
    const lines = rawText.trim().split('\n');
    if (lines.length < 2) {
      alert('CSV must contain a header and at least one data row.');
      return;
    }

    const rows: ParsedRow[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const [
        brandName,
        genericName,
        batchNumber,
        expiryDate,
        qtyStr,
        costStr,
        retailStr,
        scheduleStr,
        ndaRegNumber,
      ] = cols;

      const qty = Number(qtyStr);
      const cost = Number(costStr);
      const retail = Number(retailStr);
      const scheduleVal = (scheduleStr?.toLowerCase() || 'otc') as any;

      let hasError = false;
      let errorMsg = '';

      if (!brandName) {
        hasError = true;
        errorMsg = 'Missing Brand Name.';
      } else if (!genericName) {
        hasError = true;
        errorMsg = 'Missing Generic Ingredient.';
      } else if (!batchNumber) {
        hasError = true;
        errorMsg = 'Missing Batch Lot #.';
      } else if (!expiryDate || isNaN(Date.parse(expiryDate))) {
        hasError = true;
        errorMsg = `Invalid expiry date format '${expiryDate}'. Expected YYYY-MM-DD.`;
      } else if (isNaN(qty) || qty <= 0) {
        hasError = true;
        errorMsg = `Invalid opening stock quantity '${qtyStr}'. Must be positive number.`;
      }

      rows.push({
        rowNum: i,
        brandName: brandName || '—',
        genericName: genericName || '—',
        batchNumber: batchNumber || '—',
        expiryDate: expiryDate || '—',
        quantity: isNaN(qty) ? 0 : qty,
        costPriceUGX: isNaN(cost) ? 0 : cost,
        retailPriceUGX: isNaN(retail) ? 0 : retail,
        schedule: scheduleVal === 'controlled' || scheduleVal === 'prescription' ? scheduleVal : 'otc',
        ndaRegNumber: ndaRegNumber || '',
        status: hasError ? 'error' : 'valid',
        errorMessage: errorMsg,
      });
    }

    setParsedRows(rows);
    setIsDryRunDone(true);
    setImportCompleted(null);
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      alert('No valid rows found to import.');
      return;
    }

    const newProducts: Omit<Product, 'id'>[] = validRows.map((r, idx) => ({
      code: `IMP-${Math.floor(1000 + Math.random() * 9000)}-${idx}`,
      barcode: `616400${Math.floor(1000000 + Math.random() * 9000000)}`,
      brandName: r.brandName,
      genericName: r.genericName,
      strength: 'Standard',
      dosageForm: 'Tablet',
      category: 'Imported General',
      schedule: r.schedule,
      ndaRegNumber: r.ndaRegNumber || `NDA/IMP/${r.batchNumber}`,
      baseUnit: 'box',
      costPriceUGX: r.costPriceUGX,
      retailPriceUGX: r.retailPriceUGX,
      wholesalePriceUGX: Math.round(r.retailPriceUGX * 0.85),
      wholesaleMinQty: 5,
      reorderLevel: 10,
      taxRatePercent: 0,
      requiresPrescription: r.schedule !== 'otc',
      isControlled: r.schedule === 'controlled',
      active: true,
    }));

    const newBatches: Omit<StockBatch, 'id'>[] = validRows.map(r => ({
      productId: r.brandName,
      batchNumber: r.batchNumber,
      expiryDate: r.expiryDate,
      quantityOnHand: r.quantity,
      costPriceUGX: r.costPriceUGX,
      location: 'Shop Floor',
      supplierId: 'sup-1',
      receivedDate: new Date().toISOString().split('T')[0],
    }));

    const result = importProductsAndBatches(newProducts, newBatches);
    setImportCompleted({
      products: result.productsAdded,
      batches: result.batchesAdded,
    });
  };

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-700" />
            <span>Excel / CSV Opening Stock &amp; Catalogue Import Tool</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bulk migration for 5,000+ medicines with row-level validation, dry-run preview &amp; opening batch intake.
          </p>
        </div>

        <button
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'esart_sample_opening_stock_template.csv';
            a.click();
          }}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Template CSV</span>
        </button>
      </div>

      {/* CSV Input Area */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-800 text-xs">
            Paste CSV Data or Edit Opening Stock Below:
          </label>
          <span className="text-[11px] text-slate-500">
            Comma-delimited with standard UTF-8 headers
          </span>
        </div>

        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          rows={8}
          className="w-full p-3 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-none bg-slate-50 text-slate-800"
          placeholder="Paste CSV rows here..."
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            {rawText.trim().split('\n').length - 1} records ready for dry-run
          </span>

          <button
            onClick={handleRunValidation}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dry-Run Validation Preview</span>
          </button>
        </div>
      </div>

      {/* Dry Run Validation Results */}
      {isDryRunDone && (
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>{validCount} Clean Records</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <XCircle className="w-4 h-4" />
                  <span>{errorCount} Row Errors Flagged</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCommitImport}
              disabled={validCount === 0}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Commit {validCount} Valid Items to Live Database</span>
            </button>
          </div>

          {importCompleted && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-sm">Bulk Import Succeeded!</strong>
                <p className="mt-0.5">
                  Added <strong>{importCompleted.products}</strong> products and{' '}
                  <strong>{importCompleted.batches}</strong> opening batches with FEFO tracking to Esart Pharmacy.
                </p>
              </div>
            </div>
          )}

          {/* Row-by-Row Error and Inspection Grid */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Validation Inspection Sheet</span>
              <span className="text-[11px] text-slate-500">{parsedRows.length} total rows parsed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Row</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold">Brand / Generic</th>
                    <th className="py-2 px-3 font-semibold">Batch #</th>
                    <th className="py-2 px-3 font-semibold">Expiry Date</th>
                    <th className="py-2 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2 px-3 font-semibold text-right">Cost (UGX)</th>
                    <th className="py-2 px-3 font-semibold text-right">Retail (UGX)</th>
                    <th className="py-2 px-3 font-semibold">Schedule</th>
                    <th className="py-2 px-3 font-semibold">Validation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {parsedRows.map(row => (
                    <tr
                      key={row.rowNum}
                      className={row.status === 'error' ? 'bg-rose-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                        #{row.rowNum}
                      </td>

                      <td className="py-2 px-3">
                        {row.status === 'valid' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            PASSED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                            ERROR
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-medium text-slate-900">
                        {row.brandName}
                        <span className="text-[10px] text-slate-500 block italic">
                          {row.genericName}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono font-medium">{row.batchNumber}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{row.expiryDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{row.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {formatUGX(row.costPriceUGX)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatUGX(row.retailPriceUGX)}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-600">
                        {row.schedule}
                      </td>

                      <td className="py-2 px-3 text-[11px]">
                        {row.status === 'error' ? (
                          <span className="text-rose-700 font-semibold">{row.errorMessage}</span>
                        ) : (
                          <span className="text-slate-400">Ready for database commit</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
