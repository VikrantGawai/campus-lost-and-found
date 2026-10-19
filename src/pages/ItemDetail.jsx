import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Tag,
  Shield,
  Clock,
  ArrowLeft,
  Building,
  User,
  AlertTriangle,
  Lock,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { formatDate, formatDateTime } from '../utils/helpers';
import { SENSITIVE_CATEGORIES, ITEM_STATUSES, CLAIM_STATUSES } from '../config/constants';
import toast from 'react-hot-toast';

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { lostItems, foundItems, submitClaim, claims, updateItemStatus } = useData();
  const { addNotification } = useNotifications();

  const item = useMemo(() => {
    return [...lostItems, ...foundItems].find((i) => i.id === itemId);
  }, [lostItems, foundItems, itemId]);

  // Claim Form State
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimEvidence, setClaimEvidence] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Suspicious report dialog
  const [reportSuspiciousModal, setReportSuspiciousModal] = useState(false);
  const [suspiciousReason, setSuspiciousReason] = useState('');

  if (!item) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-navy-800">Item Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          The item ID you are searching for may have been archived or removed.
        </p>
        <button onClick={() => navigate('/browse')} className="btn-primary btn-sm">
          Browse All Items
        </button>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isOwner = currentUser?.id === item.userId;
  const isSensitive = SENSITIVE_CATEGORIES.includes(item.category);
  const locations = item.locations || (item.location ? [item.location] : []);
  const date = item.dateLost || item.dateFound || item.createdAt;

  // Check if current user already has a pending claim on this found item
  const existingClaim = claims.find(
    (c) => c.itemId === item.id && c.claimantId === currentUser?.id
  );

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!claimEvidence.trim() || claimEvidence.trim().length < 15) {
      toast.error('Please provide at least 15 characters of identifying evidence.');
      return;
    }

    setSubmittingClaim(true);
    try {
      submitClaim(
        {
          itemId: item.id,
          itemTitle: item.title,
          finderId: item.userId,
          evidence: claimEvidence.trim(),
        },
        currentUser
      );

      // Notify the finder
      addNotification(
        item.userId,
        'new_claim',
        'New Claim Filed!',
        `${currentUser.name} submitted an ownership claim for your found item "${item.title}".`,
        item.id
      );

      toast.success('Your claim has been submitted for review!');
      setClaimModalOpen(false);
      setClaimEvidence('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReportSuspicious = (e) => {
    e.preventDefault();
    if (!suspiciousReason.trim()) {
      toast.error('Please specify why this listing looks suspicious.');
      return;
    }

    toast.success('Listing flagged for moderator inspection.');
    setReportSuspiciousModal(false);
    setSuspiciousReason('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Main Item Card */}
      <div className="card space-y-6">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
                {isLost ? 'LOST REPORT' : 'FOUND ITEM'}
              </span>
              <StatusBadge status={item.status} />
              {isSensitive && (
                <span className="badge bg-amber-100 text-amber-800">
                  Sensitive Belonging
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-navy-900">{item.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Case Ref: <code>{item.id}</code> • Reported {formatDate(item.createdAt)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isLost && !isOwner && item.status === ITEM_STATUSES.ACTIVE && (
              <button
                onClick={() => setClaimModalOpen(true)}
                disabled={Boolean(existingClaim)}
                className="btn-primary btn-sm bg-teal-600 hover:bg-teal-700"
              >
                {existingClaim ? 'Claim Submitted (Pending)' : 'Claim This Item'}
              </button>
            )}

            <button
              onClick={() => setReportSuspiciousModal(true)}
              className="text-xs text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Flag Suspicious
            </button>
          </div>
        </div>

        {/* Body Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Photo */}
          <div className="md:col-span-1">
            <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No public photo provided</p>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Public Description
              </h3>
              <p className="text-sm text-navy-800 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Metadata pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </span>
                <p className="text-xs font-semibold text-navy-800 mt-1">{item.category}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date {isLost ? 'Lost' : 'Found'}
                </span>
                <p className="text-xs font-semibold text-navy-800 mt-1">{formatDate(date)}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Campus Location(s)
                </span>
                <p className="text-xs font-semibold text-navy-800 mt-1">
                  {locations.join(' • ') || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Return Assistance information for found items */}
            {!isLost && item.returnAssistance && (
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-teal-600" /> Return Assistance Arrangement
                </p>
                <p className="text-xs text-teal-800">
                  Method: <strong className="uppercase">{item.returnAssistance.replace('_', ' ')}</strong>
                </p>
                {item.returnAssistanceDetails?.collectionPointName && (
                  <p className="text-xs text-teal-700">
                    Designated Desk: <strong>{item.returnAssistanceDetails.collectionPointName}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Privacy protected notice for viewers */}
            {!isOwner && !isAdmin && (
              <div className="p-3 bg-navy-50/70 rounded-lg border border-navy-100 flex items-center gap-2 text-xs text-navy-700">
                <Lock className="w-4 h-4 text-navy-500 flex-shrink-0" />
                <span>
                  Privacy Protected: Reporter phone number and private verification proofs are hidden from public view.
                </span>
              </div>
            )}

            {/* Author / Admin View: Confidential Details */}
            {(isOwner || isAdmin) && item.privateDetails && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Private Verification Evidence (Visible only to You &amp; Authorized Desk)
                </p>
                <p className="text-xs text-amber-950 font-mono bg-white/70 p-2 rounded mt-1 whitespace-pre-wrap">
                  {item.privateDetails}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title={`Claim Item: "${item.title}"`}
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" /> Ownership Verification Standard
            </p>
            <p>
              Do not simply restate the public title. To prove ownership, provide specific unadvertised details: serial numbers, lock screens, internal items, stickers, or purchase receipts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 mb-1">
              Your Ownership Proof &amp; Evidence <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={claimEvidence}
              onChange={(e) => setClaimEvidence(e.target.value)}
              placeholder="e.g. The wallet has a college library card under my name, or the laptop lock screen has a photo of..."
              className="input-field text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setClaimModalOpen(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingClaim}
              className="btn-primary btn-sm bg-teal-600 hover:bg-teal-700"
            >
              {submittingClaim ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Flag Suspicious Modal */}
      <Modal
        isOpen={reportSuspiciousModal}
        onClose={() => setReportSuspiciousModal(false)}
        title="Report Suspicious Item Listing"
      >
        <form onSubmit={handleReportSuspicious} className="space-y-4">
          <p className="text-xs text-gray-500">
            Help campus admins detect fraudulent listings, inappropriate content, or spam.
          </p>
          <div>
            <label className="block text-xs font-semibold text-navy-700 mb-1">
              Reason for concern
            </label>
            <textarea
              rows={3}
              value={suspiciousReason}
              onChange={(e) => setSuspiciousReason(e.target.value)}
              placeholder="Explain why this listing seems suspicious or incorrect..."
              className="input-field text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportSuspiciousModal(false)}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-danger btn-sm">
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
