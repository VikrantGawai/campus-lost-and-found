import { useState } from 'react';
import {
  Shield,
  Building,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Archive,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { formatDate, formatDateTime } from '../utils/helpers';
import { ITEM_STATUSES, CLAIM_STATUSES } from '../config/constants';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { currentUser, isAdmin } = useAuth();
  const {
    lostItems,
    foundItems,
    claims,
    handovers,
    collectionPoints,
    auditLog,
    updateItemStatus,
    reviewClaim,
    addCollectionPoint,
    updateCollectionPoint,
  } = useData();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('unresolved'); // 'unresolved' | 'claims' | 'points' | 'audit'

  // Add collection point state
  const [pointModal, setPointModal] = useState({
    isOpen: false,
    name: '',
    location: '',
    hours: '',
    contactEmail: '',
  });

  // Close case dialog
  const [closeCaseModal, setCloseCaseModal] = useState({
    isOpen: false,
    item: null,
    reason: 'Returned to owner at desk',
  });

  // Disputed claim review
  const [disputeModal, setDisputeModal] = useState({
    isOpen: false,
    claim: null,
    decision: 'approved',
    adminNotes: '',
  });

  if (!isAdmin) {
    return (
      <div className="card text-center py-16 max-w-md mx-auto">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-800">Access Restricted</h2>
        <p className="text-xs text-gray-500 mt-1">
          This administration and collection desk interface is restricted to authorized campus staff.
          In demo mode, switch your profile to "Admin Desk" in the top bar.
        </p>
      </div>
    );
  }

  const allActiveItems = [...lostItems, ...foundItems].filter(
    (i) => i.status === ITEM_STATUSES.ACTIVE || i.status === ITEM_STATUSES.MATCHED
  );

  const pendingOrDisputedClaims = claims.filter(
    (c) => c.status === CLAIM_STATUSES.PENDING || c.status === CLAIM_STATUSES.MANUAL_REVIEW
  );

  // Close case handler
  const handleCloseCase = (e) => {
    e.preventDefault();
    if (!closeCaseModal.item) return;

    updateItemStatus(closeCaseModal.item.id, ITEM_STATUSES.CLOSED, currentUser.id);

    addNotification(
      closeCaseModal.item.userId,
      'case_closed',
      'Case Closed by Campus Admin',
      `Your item case "${closeCaseModal.item.title}" was closed: ${closeCaseModal.reason}`,
      closeCaseModal.item.id
    );

    toast.success('Case closed and item archived.');
    setCloseCaseModal({ isOpen: false, item: null, reason: 'Returned to owner at desk' });
  };

  // Add collection point handler
  const handleAddPoint = (e) => {
    e.preventDefault();
    if (!pointModal.name.trim() || !pointModal.location.trim()) {
      toast.error('Point name and campus location are required.');
      return;
    }

    addCollectionPoint(
      {
        name: pointModal.name.trim(),
        location: pointModal.location.trim(),
        hours: pointModal.hours.trim() || 'Mon-Fri 9:00 AM - 5:00 PM',
        contactEmail: pointModal.contactEmail.trim() || 'desk@campus.edu',
      },
      currentUser.id
    );

    toast.success('Collection point registered!');
    setPointModal({ isOpen: false, name: '', location: '', hours: '', contactEmail: '' });
  };

  // Resolve disputed claim
  const handleDisputeDecision = (e) => {
    e.preventDefault();
    if (!disputeModal.claim) return;

    reviewClaim(
      disputeModal.claim.id,
      disputeModal.decision,
      `[Admin Resolution] ${disputeModal.adminNotes.trim()}`,
      currentUser.id
    );

    // If approved, mark found item claimed
    if (disputeModal.decision === 'approved') {
      updateItemStatus(disputeModal.claim.itemId, ITEM_STATUSES.CLAIMED, currentUser.id);
    }

    addNotification(
      disputeModal.claim.claimantId,
      'claim_decision',
      `Disputed Claim ${disputeModal.decision === 'approved' ? 'Approved' : 'Rejected'} by Admin Desk`,
      `Campus administration has reviewed your claim for "${disputeModal.claim.itemTitle}". Decision: ${disputeModal.decision}.`,
      disputeModal.claim.itemId
    );

    toast.success(`Dispute resolved as ${disputeModal.decision}!`);
    setDisputeModal({ isOpen: false, claim: null, decision: 'approved', adminNotes: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" /> Admin &amp; Collection Desk
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Authorized oversight: manage collection desks, adjudicate disputed claims, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPointModal({ isOpen: true, name: '', location: '', hours: '', contactEmail: '' })}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Collection Desk
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('unresolved')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'unresolved' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Unresolved Registry ({allActiveItems.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'claims' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Claims &amp; Disputes ({pendingOrDisputedClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'points' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Collection Points ({collectionPoints.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'audit' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-navy-700'
          }`}
        >
          Audit Log ({auditLog.length})
        </button>
      </div>

      {/* TAB 1: UNRESOLVED REGISTRY */}
      {activeTab === 'unresolved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Monitoring active lost and found reports requiring campus resolution.</span>
          </div>

          <div className="space-y-3">
            {allActiveItems.map((item) => (
              <div key={item.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                      {item.type.toUpperCase()}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-gray-400">By: {item.userName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-900">{item.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    Loc: {(item.locations || [item.location]).join(', ')} • Reported {formatDate(item.createdAt)}
                  </p>
                  {item.privateDetails && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1">
                      Private Evidence: {item.privateDetails}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCloseCaseModal({ isOpen: true, item, reason: 'Returned to owner at desk' })}
                    className="btn-secondary btn-sm text-xs flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" /> Close Case
                  </button>
                  <button
                    onClick={() => {
                      updateItemStatus(item.id, ITEM_STATUSES.RETURNED, currentUser.id);
                      toast.success(`Marked "${item.title}" as returned.`);
                    }}
                    className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                  >
                    Mark Returned
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS & DISPUTES */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Claims submitted by students. Desk administrators have override authority to verify proof.
          </p>

          {claims.length === 0 ? (
            <div className="card text-center py-8 text-gray-500 text-sm">No claims logged yet.</div>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="card p-4 space-y-3 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className="text-xs font-semibold text-navy-800">
                        Claimant: {c.claimantName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-navy-900">Item: {c.itemTitle}</h4>
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg text-xs text-navy-800 border border-gray-100">
                      <p className="font-semibold text-gray-600 mb-0.5">Submitted Evidence Proof:</p>
                      <p className="whitespace-pre-wrap">{c.evidence}</p>
                    </div>
                  </div>

                  {c.reviewNote && (
                    <p className="text-xs text-gray-500 italic">Reviewer Feedback: "{c.reviewNote}"</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setDisputeModal({ isOpen: true, claim: c, decision: 'rejected', adminNotes: '' })}
                      className="btn-danger btn-sm text-xs"
                    >
                      Admin Reject
                    </button>
                    <button
                      onClick={() => setDisputeModal({ isOpen: true, claim: c, decision: 'approved', adminNotes: '' })}
                      className="btn-primary btn-sm text-xs bg-teal-600 hover:bg-teal-700"
                    >
                      Admin Verify &amp; Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COLLECTION POINTS */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collectionPoints.map((cp) => (
              <div key={cp.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className={`badge ${cp.isActive ? 'badge-found' : 'badge-closed'}`}>
                    {cp.isActive ? 'Operating' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-navy-900">{cp.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{cp.location}</p>
                </div>

                <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
                  <p><strong>Operating Hours:</strong> {cp.hours}</p>
                  <p><strong>Contact:</strong> {cp.contactEmail}</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => updateCollectionPoint(cp.id, { isActive: !cp.isActive }, currentUser.id)}
                    className="btn-secondary btn-sm text-xs"
                  >
                    {cp.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Immutable system audit trails tracking report creation, status shifts, and claim verifications.
          </p>

          <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
            {auditLog.map((log) => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-teal-700 font-bold uppercase">{log.action}</span>
                    <span className="text-gray-400">• User: {log.userId}</span>
                  </div>
                  <p className="text-navy-800">{log.details}</p>
                </div>
                <span className="text-gray-400 whitespace-nowrap text-[11px]">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close Case Modal */}
      <Modal
        isOpen={closeCaseModal.isOpen}
        onClose={() => setCloseCaseModal({ isOpen: false, item: null, reason: '' })}
        title={`Close Case: "${closeCaseModal.item?.title}"`}
      >
        <form onSubmit={handleCloseCase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Closure Reason
            </label>
            <select
              value={closeCaseModal.reason}
              onChange={(e) => setCloseCaseModal({ ...closeCaseModal, reason: e.target.value })}
              className="input-field text-sm"
            >
              <option value="Returned to owner at desk">Returned to owner at desk</option>
              <option value="Delivered via campus volunteer">Delivered via campus volunteer</option>
              <option value="Duplicate or fraudulent listing removed">Duplicate or fraudulent listing removed</option>
              <option value="Expired unclaimed (transferred to campus security storage)">
                Expired unclaimed (transferred to campus security storage)
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCloseCaseModal({ isOpen: false, item: null, reason: '' })}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm bg-teal-600 hover:bg-teal-700">
              Confirm &amp; Archive Case
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Collection Point Modal */}
      <Modal
        isOpen={pointModal.isOpen}
        onClose={() => setPointModal({ isOpen: false, name: '', location: '', hours: '', contactEmail: '' })}
        title="Add Campus Collection Desk"
      >
        <form onSubmit={handleAddPoint} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Desk / Collection Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pointModal.name}
              onChange={(e) => setPointModal({ ...pointModal, name: e.target.value })}
              placeholder="e.g. Science Block Helpdesk"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Building / Campus Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pointModal.location}
              onChange={(e) => setPointModal({ ...pointModal, location: e.target.value })}
              placeholder="e.g. Science Building Floor 1"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Operating Hours
            </label>
            <input
              type="text"
              value={pointModal.hours}
              onChange={(e) => setPointModal({ ...pointModal, hours: e.target.value })}
              placeholder="e.g. Mon-Fri 8:30 AM - 6:00 PM"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={pointModal.contactEmail}
              onChange={(e) => setPointModal({ ...pointModal, contactEmail: e.target.value })}
              placeholder="e.g. science-desk@campus.edu"
              className="input-field text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPointModal({ isOpen: false, name: '', location: '', hours: '', contactEmail: '' })}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm bg-teal-600 hover:bg-teal-700">
              Save Collection Desk
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjudicate Dispute Modal */}
      <Modal
        isOpen={disputeModal.isOpen}
        onClose={() => setDisputeModal({ isOpen: false, claim: null, decision: 'approved', adminNotes: '' })}
        title="Admin Claim Adjudication"
      >
        <form onSubmit={handleDisputeDecision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Official Determination
            </label>
            <select
              value={disputeModal.decision}
              onChange={(e) => setDisputeModal({ ...disputeModal, decision: e.target.value })}
              className="input-field text-sm"
            >
              <option value="approved">Approve Ownership &amp; Award Item</option>
              <option value="rejected">Reject Claim (Insufficient Proof)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Official Desk Notes
            </label>
            <textarea
              rows={3}
              value={disputeModal.adminNotes}
              onChange={(e) => setDisputeModal({ ...disputeModal, adminNotes: e.target.value })}
              placeholder="Record reason for verification decision..."
              className="input-field text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDisputeModal({ isOpen: false, claim: null, decision: 'approved', adminNotes: '' })}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm bg-teal-600 hover:bg-teal-700">
              Record Official Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
