import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUGX, formatDateTime } from '../../services/formatters';
import { validateApprovalPermission } from '../../services/approvals';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
} from 'lucide-react';
import { ApprovalRequest } from '../../types';

export const ApprovalsQueueView: React.FC = () => {
  const { approvals, reviewApproval, currentUser, users } = useApp();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviewNotes, setReviewNotes] = useState<string>('Reviewed and compliant with Esart operational rules.');

  const filteredApprovals = approvals.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const handleReview = (request: ApprovalRequest, action: 'approved' | 'rejected') => {
    const result = reviewApproval(request.id, action, reviewNotes);
    if (!result.success) {
      alert(`Approval Blocked:\n\n${result.error}`);
    } else {
      alert(`Request has been marked as ${action.toUpperCase()}.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-700" />
            <span>Director Approvals &amp; Dual-Control Governance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict segregation of duties: No user can approve their own transaction. Weekly report visible to all directors.
          </p>
        </div>

        {/* Current User Role Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs">
          <span className="text-slate-500">Reviewing as:</span>
          <strong className="text-slate-900">{currentUser.name}</strong>
          <span className="capitalize font-semibold text-emerald-700">({currentUser.role})</span>
        </div>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold">Dual-Control Policy Enforced:</strong>
          <p className="text-emerald-800 text-[11px]">
            Any transaction exceeding threshold limits (discounts &gt; 5%, refunds, or damaged stock write-offs)
            requires secondary director approval. The system strictly disables self-approval. To test rejection of self-approval,
            switch your active user to the requester in the top-right header menu!
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs border-b border-slate-200 pb-2">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Review ({approvals.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            statusFilter === 'approved'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved ({approvals.filter(a => a.status === 'approved').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rejected ({approvals.filter(a => a.status === 'rejected').length})
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            statusFilter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Requests
        </button>
      </div>

      {/* Approvals Cards / List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No requests in this queue</p>
          </div>
        ) : (
          filteredApprovals.map(req => {
            const check = validateApprovalPermission(req, currentUser);
            const isSelfRequest = req.requestedByUserId === currentUser.id;

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.requestType === 'discount'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : req.requestType === 'write_off'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : req.requestType === 'refund'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {req.requestType.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{req.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.amountUGX !== undefined && (
                      <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                        {formatUGX(req.amountUGX)}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed">
                  {req.details}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-4">
                    <span>
                      Requested by: <strong className="text-slate-800">{req.requestedByUserName}</strong>
                    </span>
                    <span>·</span>
                    <span>Date: {formatDateTime(req.requestedAt)}</span>
                  </div>

                  {req.reviewedByUserName && (
                    <div className="text-emerald-800 font-medium">
                      Reviewed by Director {req.reviewedByUserName} on {formatDateTime(req.reviewedAt!)}: "
                      {req.reviewNotes}"
                    </div>
                  )}
                </div>

                {/* Actions for Pending Requests */}
                {req.status === 'pending' && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {isSelfRequest ? (
                      <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>
                          Self-Approval Blocked: You requested this transaction. Must be approved by a different Director.
                        </span>
                      </div>
                    ) : !check.canApprove ? (
                      <div className="text-amber-700 text-xs font-medium">
                        {check.reason}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Audit rationale note..."
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          className="flex-1 p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleReview(req, 'rejected')}
                        disabled={!check.canApprove}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 disabled:opacity-40 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReview(req, 'approved')}
                        disabled={!check.canApprove}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded disabled:opacity-40 transition-colors shadow-xs"
                      >
                        Authorize &amp; Sign Off
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
