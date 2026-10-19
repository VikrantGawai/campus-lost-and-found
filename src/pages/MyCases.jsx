import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  HandMetal,
  RotateCcw,
  AlertCircle,
  Building,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import { formatDate, formatDateTime } from '../utils/helpers';
import { ITEM_STATUSES, CLAIM_STATUSES, HANDOVER_STATUSES } from '../config/constants';
import toast from 'react-hot-toast';

export default function MyCases() {
  const navigate = useNavigate();
  const { currentUser, isVolunteer, isAdmin } = useAuth();
  const {
    getUserItems,
    getUserClaims,
    getUserHandovers,
    updateItemStatus,
    reviewClaim,
    updateHandover,
    foundItems,
  } = useData();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'claims' | 'handovers'

  // Dialog state for resolving / marking returned
  const [resolveDialog, setResolveDialog] = useState({ isOpen: false, item: null });

  // Dialog state for reviewing claims
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    claim: null,
    decision: 'approved',
    note: '',
  });

  // Dialog state for updating handover
  const [handoverDialog, setHandoverDialog] = useState({
    isOpen: false,
    handover: null,
    action: '',
    date: '',
    time: '',
    location: '',
  });

  const { lost, found } = getUserItems(currentUser?.id);
  const { submitted: myClaims, received: claimsOnMyItems } = getUserClaims(currentUser?.id);
  const myHandovers = getUserHandovers(currentUser?.id);

  // Mark item recovered independently
  const handleMarkRecovered = (item) => {
    updateItemStatus(item.id, ITEM_STATUSES.RETURNED, currentUser.id);
    addNotification(
      currentUser.id,
      'item_returned',
      'Case Resolved!',
      `You marked "${item.title}" as recovered/returned. Case is now closed.`,
      item.id
    );
    toast.success('Item marked as returned and case closed!');
  };

  // Submit claim review decision
  const handleClaimReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewDialog.claim) return;

    reviewClaim(
      reviewDialog.claim.id,
      reviewDialog.decision,
      reviewDialog.note.trim(),
      currentUser.id
    );

    // Notify claimant
    addNotification(
      reviewDialog.claim.claimantId,
      'claim_decision',
      `Claim ${reviewDialog.decision === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your claim for "${reviewDialog.claim.itemTitle}" has been ${reviewDialog.decision}. Notes: ${reviewDialog.note || 'None'}`,
      reviewDialog.claim.itemId
    );

    toast.success(`Claim ${reviewDialog.decision}!`);
    setReviewDialog({ isOpen: false, claim: null, decision: 'approved', note: '' });
  };

  // Accept or manage Handover
  const handleHandoverAction = (handover, action, updates = {}) => {
    updateHandover(handover.id, { status: action, ...updates }, currentUser.id);

    // Notify other party
    const targetUserId = handover.finderId === currentUser.id ? handover.volunteerId : handover.finderId;
    if (targetUserId) {
      addNotification(
        targetUserId,
        'handover_update',
        `Handover Status: ${action.toUpperCase()}`,
        `Handover for "${handover.itemTitle}" was updated to ${action}.`,
        handover.itemId
      );
    }

    toast.success(`Handover status updated to ${action}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">My Cases &amp; Activity</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track all reports, claims, and return handovers under your account.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'reports' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          My Reports ({lost.length + found.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'claims' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Claims ({myClaims.length} sent • {claimsOnMyItems.length} received)
        </button>
        <button
          onClick={() => setActiveTab('handovers')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'handovers' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Handovers ({myHandovers.length})
        </button>
      </div>

      {/* TAB 1: MY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Lost items */}
          <div>
            <h2 className="text-base font-bold text-navy-800 mb-3 flex items-center gap-2">
              <span className="badge badge-lost">LOST</span> Items You Reported Lost ({lost.length})
            </h2>
            {lost.length === 0 ? (
              <div className="card text-center py-6 text-sm text-gray-500">
                You haven't reported any lost items.
              </div>
            ) : (
              <div className="space-y-3">
                {lost.map((item) => (
                  <div key={item.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-gray-400">Reported {formatDate(item.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-navy-800">{item.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/item/${item.id}`)}
                        className="btn-secondary btn-sm text-xs"
                      >
                        Inspect
                      </button>
                      {item.status === ITEM_STATUSES.ACTIVE && (
                        <button
                          onClick={() => setResolveDialog({ isOpen: true, item })}
                          className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Mark Recovered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Found items */}
          <div>
            <h2 className="text-base font-bold text-navy-800 mb-3 flex items-center gap-2">
              <span className="badge badge-found">FOUND</span> Items You Reported Found ({found.length})
            </h2>
            {found.length === 0 ? (
              <div className="card text-center py-6 text-sm text-gray-500">
                You haven't logged any found items.
              </div>
            ) : (
              <div className="space-y-3">
                {found.map((item) => (
                  <div key={item.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-gray-400">Found {formatDate(item.createdAt)}</span>
                        {item.returnAssistance && (
                          <span className="badge bg-blue-50 text-blue-700 text-[10px]">
                            {item.returnAssistance.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-navy-800">{item.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/item/${item.id}`)}
                        className="btn-secondary btn-sm text-xs"
                      >
                        Inspect
                      </button>
                      {item.status === ITEM_STATUSES.ACTIVE && (
                        <button
                          onClick={() => setResolveDialog({ isOpen: true, item })}
                          className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Mark Returned
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          {/* Incoming claims to review */}
          <div>
            <h2 className="text-base font-bold text-navy-800 mb-2">
              Claims Filed on Items You Found ({claimsOnMyItems.length})
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Students asserting ownership of items you reported. Carefully verify private evidence before approving.
            </p>

            {claimsOnMyItems.length === 0 ? (
              <div className="card text-center py-6 text-sm text-gray-500">
                No claims filed on your found items yet.
              </div>
            ) : (
              <div className="space-y-3">
                {claimsOnMyItems.map((c) => (
                  <div key={c.id} className="card p-4 space-y-3 border-l-4 border-l-teal-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-navy-700 font-semibold">Claimant: {c.claimantName}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-navy-900">Item: {c.itemTitle}</h4>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-navy-800 border border-gray-100">
                        <p className="font-semibold text-gray-600 mb-0.5">Private Proof Submitted:</p>
                        <p className="whitespace-pre-wrap">{c.evidence}</p>
                      </div>
                    </div>

                    {c.reviewNote && (
                      <p className="text-xs text-gray-500 italic">Reviewer note: "{c.reviewNote}"</p>
                    )}

                    {c.status === CLAIM_STATUSES.PENDING && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setReviewDialog({ isOpen: true, claim: c, decision: 'rejected', note: '' })}
                          className="btn-danger btn-sm text-xs"
                        >
                          Reject Claim
                        </button>
                        <button
                          onClick={() => setReviewDialog({ isOpen: true, claim: c, decision: 'manual_review', note: '' })}
                          className="btn-secondary btn-sm text-xs"
                        >
                          Request Desk Review
                        </button>
                        <button
                          onClick={() => setReviewDialog({ isOpen: true, claim: c, decision: 'approved', note: '' })}
                          className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Approve Ownership
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing claims */}
          <div>
            <h2 className="text-base font-bold text-navy-800 mb-2">
              Claims You Submitted ({myClaims.length})
            </h2>
            {myClaims.length === 0 ? (
              <div className="card text-center py-6 text-sm text-gray-500">
                You haven't submitted any ownership claims.
              </div>
            ) : (
              <div className="space-y-3">
                {myClaims.map((c) => (
                  <div key={c.id} className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-gray-400">Filed {formatDate(c.createdAt)}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-navy-900">Claim on: {c.itemTitle}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">Evidence provided: {c.evidence}</p>
                    {c.reviewNote && (
                      <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                        <strong>Decision feedback:</strong> {c.reviewNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HANDOVERS */}
      {activeTab === 'handovers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-800">Return Handovers &amp; Logistics</h2>
              <p className="text-xs text-gray-500">
                Track drop-offs, volunteer dispatches, and public returns.
              </p>
            </div>
          </div>

          {myHandovers.length === 0 ? (
            <div className="card text-center py-8 text-sm text-gray-500">
              No active return handovers assigned to you.
            </div>
          ) : (
            <div className="space-y-3">
              {myHandovers.map((h) => (
                <div key={h.id} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-xs font-semibold text-navy-700">
                        Method: {h.method.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(h.createdAt)}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy-900">{h.itemTitle}</h4>
                    {h.collectionPointName && (
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-teal-600" />
                        Collection Desk: <strong>{h.collectionPointName}</strong>
                      </p>
                    )}
                    {h.scheduledTime && (
                      <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Scheduled: {formatDateTime(h.scheduledTime)} at {h.scheduledLocation}
                      </p>
                    )}
                    {h.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">Notes: {h.notes}</p>
                    )}
                  </div>

                  {/* Handover state transitions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    {/* If requested and volunteer/finder */}
                    {h.status === HANDOVER_STATUSES.REQUESTED && (
                      <>
                        <button
                          onClick={() => handleHandoverAction(h, HANDOVER_STATUSES.CANCELLED)}
                          className="btn-danger btn-sm text-xs"
                        >
                          Cancel Handover
                        </button>
                        <button
                          onClick={() => handleHandoverAction(h, HANDOVER_STATUSES.ACCEPTED)}
                          className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Accept Handover
                        </button>
                      </>
                    )}

                    {h.status === HANDOVER_STATUSES.ACCEPTED && (
                      <>
                        <button
                          onClick={() => handleHandoverAction(h, HANDOVER_STATUSES.DEPOSITED)}
                          className="btn-primary btn-sm text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          Confirm Deposited at Desk
                        </button>
                        <button
                          onClick={() => handleHandoverAction(h, HANDOVER_STATUSES.RETURNED)}
                          className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                        >
                          Confirm Returned to Owner
                        </button>
                      </>
                    )}

                    {h.status === HANDOVER_STATUSES.DEPOSITED && (
                      <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2.5 py-1 rounded-full">
                        Deposited at Collection Desk • Awaiting Claimant Pickup
                      </span>
                    )}

                    {h.status === HANDOVER_STATUSES.RETURNED && (
                      <span className="text-xs text-gray-500 font-medium">
                        ✓ Case Returned &amp; Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resolve Dialog */}
      <ConfirmDialog
        isOpen={resolveDialog.isOpen}
        onClose={() => setResolveDialog({ isOpen: false, item: null })}
        onConfirm={() => handleMarkRecovered(resolveDialog.item)}
        title="Mark Item Recovered"
        message={`Are you sure you want to mark "${resolveDialog.item?.title}" as recovered? This will update its status to Returned, close the active case, and remove it from available listings.`}
        confirmLabel="Mark Returned"
      />

      {/* Review Claim Modal */}
      <Modal
        isOpen={reviewDialog.isOpen}
        onClose={() => setReviewDialog({ isOpen: false, claim: null, decision: 'approved', note: '' })}
        title={`Review Claim for "${reviewDialog.claim?.itemTitle}"`}
      >
        <form onSubmit={handleClaimReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Decision
            </label>
            <select
              value={reviewDialog.decision}
              onChange={(e) => setReviewDialog({ ...reviewDialog, decision: e.target.value })}
              className="input-field text-sm"
            >
              <option value="approved">Approve (Owner Verified)</option>
              <option value="rejected">Reject (Evidence Does Not Match)</option>
              <option value="manual_review">Flag for Collection Desk Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Reviewer Notes (Shared with Claimant)
            </label>
            <textarea
              rows={3}
              value={reviewDialog.note}
              onChange={(e) => setReviewDialog({ ...reviewDialog, note: e.target.value })}
              placeholder="e.g. Serial numbers match, or please provide alternate proof..."
              className="input-field text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReviewDialog({ isOpen: false, claim: null, decision: 'approved', note: '' })}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm">
              Confirm Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
