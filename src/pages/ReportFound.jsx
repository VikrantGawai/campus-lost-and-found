import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, MapPin, Building, Users, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import ImageUpload from '../components/common/ImageUpload';
import ItemCard from '../components/common/ItemCard';
import {
  ITEM_CATEGORIES,
  CAMPUS_LOCATIONS,
  HANDOVER_METHODS,
  SENSITIVE_CATEGORIES,
} from '../config/constants';
import toast from 'react-hot-toast';

export default function ReportFound() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reportFoundItem, collectionPoints } = useData();
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    photoUrl: null,
    dateFound: new Date().toISOString().slice(0, 16),
    location: '',
    privateDetails: '',
    canKeepTemporarily: true,
    returnAssistance: HANDOVER_METHODS.KEEP_TEMPORARILY,
    collectionPointId: collectionPoints[0]?.id || '',
    volunteerNotes: '',
    meetupLocation: '',
    meetupTime: '',
  });

  const [errors, setErrors] = useState({});
  const [submittedResult, setSubmittedResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Found item summary is required.';
    if (!formData.category) errs.category = 'Category is required.';
    if (!formData.description.trim()) errs.description = 'Public description is required.';
    else if (formData.description.trim().length < 15) {
      errs.description = 'Please describe the item with at least 15 characters.';
    }
    if (!formData.location) errs.location = 'Location where found is required.';
    if (!formData.dateFound) errs.dateFound = 'Date and time found is required.';

    if (formData.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT && !formData.collectionPointId) {
      errs.collectionPointId = 'Please select an authorized campus collection desk.';
    }

    if (formData.returnAssistance === HANDOVER_METHODS.SCHEDULED_MEETUP) {
      if (!formData.meetupLocation.trim()) errs.meetupLocation = 'Handover location proposal required.';
      if (!formData.meetupTime) errs.meetupTime = 'Proposed time required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setSubmitting(true);
    try {
      let returnAssistanceDetails = null;
      if (formData.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT) {
        const cp = collectionPoints.find((p) => p.id === formData.collectionPointId);
        returnAssistanceDetails = {
          collectionPointId: cp?.id,
          collectionPointName: cp?.name,
          collectionPointLocation: cp?.location,
        };
      } else if (formData.returnAssistance === HANDOVER_METHODS.VOLUNTEER) {
        returnAssistanceDetails = {
          volunteerNotes: formData.volunteerNotes.trim(),
          volunteerAssigned: null,
          volunteerStatus: 'pending_dispatch',
        };
      } else if (formData.returnAssistance === HANDOVER_METHODS.SCHEDULED_MEETUP) {
        returnAssistanceDetails = {
          meetupLocation: formData.meetupLocation.trim(),
          meetupTime: formData.meetupTime,
        };
      }

      const result = reportFoundItem(
        {
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
          photoUrl: formData.photoUrl,
          dateFound: new Date(formData.dateFound).toISOString(),
          location: formData.location,
          privateDetails: formData.privateDetails.trim() || null,
          canKeepTemporarily: formData.canKeepTemporarily,
          returnAssistance: formData.returnAssistance,
          returnAssistanceDetails,
        },
        currentUser
      );

      // Alert about matches
      if (result.matches.length > 0) {
        addNotification(
          currentUser.id,
          'match_found',
          'Potential Lost Item Matches',
          `Your found report for "${formData.title}" may match ${result.matches.length} lost report(s).`,
          result.item.id
        );
      }

      setSubmittedResult(result);
      toast.success('Found item logged successfully!');
    } catch (err) {
      toast.error('Failed to log found item: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSensitive = SENSITIVE_CATEGORIES.includes(formData.category);

  if (submittedResult) {
    const { item, matches } = submittedResult;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card text-center py-8">
          <CheckCircle2 className="w-14 h-14 text-teal-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-navy-800">Found Item Logged Successfully</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Thank you for helping keep our campus honest and helpful. The item has been posted to the registry.
          </p>

          {item.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT && (
            <div className="mt-4 p-3 bg-teal-50 text-teal-800 rounded-lg max-w-md mx-auto text-xs text-left">
              <p className="font-semibold">Next Step: Drop-off at Collection Desk</p>
              <p className="mt-1">
                Please hand this item over to{' '}
                <strong>{item.returnAssistanceDetails?.collectionPointName}</strong> at your convenience. Show your report reference ID: <code>{item.id}</code>.
              </p>
            </div>
          )}

          {item.returnAssistance === HANDOVER_METHODS.VOLUNTEER && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg max-w-md mx-auto text-xs text-left">
              <p className="font-semibold">Volunteer Request Logged</p>
              <p className="mt-1">
                A campus volunteer will be dispatched to coordinate collection. Status will remain <strong>Pending</strong> until an active volunteer accepts the handover task.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => navigate('/my-cases')} className="btn-primary btn-sm">
              View in My Cases
            </button>
            <button
              onClick={() => {
                setSubmittedResult(null);
                setFormData({
                  title: '',
                  category: '',
                  description: '',
                  photoUrl: null,
                  dateFound: new Date().toISOString().slice(0, 16),
                  location: '',
                  privateDetails: '',
                  canKeepTemporarily: true,
                  returnAssistance: HANDOVER_METHODS.KEEP_TEMPORARILY,
                  collectionPointId: collectionPoints[0]?.id || '',
                  volunteerNotes: '',
                  meetupLocation: '',
                  meetupTime: '',
                });
              }}
              className="btn-secondary btn-sm"
            >
              Report Another Item
            </button>
          </div>
        </div>

        {/* Possible Matches */}
        <div>
          <h3 className="text-lg font-bold text-navy-800 mb-2">
            Possible Lost Reports Matching This ({matches.length})
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Students who previously reported losing items with similar traits:
          </p>

          {matches.length === 0 ? (
            <div className="card text-center py-8 text-gray-500 text-sm">
              No matching lost reports recorded yet. We'll alert you if someone reports an item that matches this found record.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.item.id} className="card p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {m.score}% Potential Match
                    </span>
                    <button
                      onClick={() => navigate(`/item/${m.item.id}`)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Inspect Lost Report →
                    </button>
                  </div>
                  <ItemCard item={m.item} />
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-navy-700 uppercase tracking-wide">
                      Matching rationale:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 mt-0.5">
                      {m.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Report a Found Item</h1>
        <p className="text-gray-500 text-sm mt-1">
          Help return lost items. You do not need to know who owns it or disclose your phone number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Item Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Set of Dorm Keys, Blue Water Bottle, Calculator"
            className="input-field"
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-field"
          >
            <option value="">Select a category</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
        </div>

        {/* Sensitive Item Security Notice */}
        {isSensitive && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Confidential Belonging Safeguard</p>
              <p className="mt-0.5">
                Do not publicly post ID card full numbers, debit card digits, or laptop passwords. Keep exact serial numbers and specific proof questions private for claimant verification.
              </p>
            </div>
          </div>
        )}

        {/* Public Description */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Public Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what the item looks like externally, brand name, general condition..."
            className="input-field"
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Campus Location */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Where was it found? <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="input-field"
          >
            <option value="">Select campus location</option>
            {CAMPUS_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>

        {/* Date Found */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Date &amp; Time Found <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.dateFound}
            onChange={(e) => setFormData({ ...formData, dateFound: e.target.value })}
            className="input-field"
          />
          {errors.dateFound && <p className="text-xs text-red-600 mt-1">{errors.dateFound}</p>}
        </div>

        {/* Photo */}
        <ImageUpload
          value={formData.photoUrl}
          onChange={(val) => setFormData({ ...formData, photoUrl: val })}
          label="Optional Photo of Found Item"
        />

        {/* Private Verifiable Details */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Private Verification Clues (Kept Confidential)
          </label>
          <textarea
            rows={2}
            value={formData.privateDetails}
            onChange={(e) => setFormData({ ...formData, privateDetails: e.target.value })}
            placeholder="Details only the real owner would know (e.g. keychain engraving, lock screen photo, exact cash denomination)..."
            className="input-field"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Hidden from public. Used by you or desk staff to cross-check claims.
          </p>
        </div>

        {/* RETURN ASSISTANCE SECTION */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-navy-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-600" /> Return Assistance &amp; Custody
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              You are never forced to keep or personally deliver an item. Choose what works best for you:
            </p>
          </div>

          <div className="grid gap-3">
            {/* Option 1: Drop at Collection Point */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              formData.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT
                ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="assistance"
                checked={formData.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT}
                onChange={() => setFormData({ ...formData, returnAssistance: HANDOVER_METHODS.COLLECTION_POINT })}
                className="mt-1 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-800">
                  Drop off at an Authorized Campus Collection Desk (Recommended)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Transfer responsibility to an official campus desk (Library, Student Center, Security).
                </p>

                {formData.returnAssistance === HANDOVER_METHODS.COLLECTION_POINT && (
                  <div className="mt-3">
                    <select
                      value={formData.collectionPointId}
                      onChange={(e) => setFormData({ ...formData, collectionPointId: e.target.value })}
                      className="input-field text-xs py-2 bg-white"
                    >
                      {collectionPoints.filter((p) => p.isActive).map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name} ({cp.location}) — Hours: {cp.hours}
                        </option>
                      ))}
                    </select>
                    {errors.collectionPointId && (
                      <p className="text-xs text-red-600 mt-1">{errors.collectionPointId}</p>
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: Request a Volunteer */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              formData.returnAssistance === HANDOVER_METHODS.VOLUNTEER
                ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="assistance"
                checked={formData.returnAssistance === HANDOVER_METHODS.VOLUNTEER}
                onChange={() => setFormData({ ...formData, returnAssistance: HANDOVER_METHODS.VOLUNTEER })}
                className="mt-1 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-800">
                  Request a Campus Volunteer Courier
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Request an authorized student volunteer to collect the item from your location on campus.
                </p>

                {formData.returnAssistance === HANDOVER_METHODS.VOLUNTEER && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={formData.volunteerNotes}
                      onChange={(e) => setFormData({ ...formData, volunteerNotes: e.target.value })}
                      placeholder="Pickup notes (e.g. at Science Block foyer until 4 PM)..."
                      className="input-field text-xs py-2 bg-white"
                    />
                    <p className="text-[10px] text-amber-700 mt-1">
                      Note: Volunteer status remains strictly Pending until an authorized volunteer accepts.
                    </p>
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Propose Scheduled Handover */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              formData.returnAssistance === HANDOVER_METHODS.SCHEDULED_MEETUP
                ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="assistance"
                checked={formData.returnAssistance === HANDOVER_METHODS.SCHEDULED_MEETUP}
                onChange={() => setFormData({ ...formData, returnAssistance: HANDOVER_METHODS.SCHEDULED_MEETUP })}
                className="mt-1 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-800">
                  Arrange a Scheduled Public Campus Handover
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Propose meeting directly with the verified claimant at a safe campus spot.
                </p>

                {formData.returnAssistance === HANDOVER_METHODS.SCHEDULED_MEETUP && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.meetupLocation}
                      onChange={(e) => setFormData({ ...formData, meetupLocation: e.target.value })}
                      placeholder="e.g. Student Center Cafeteria"
                      className="input-field text-xs py-2 bg-white"
                    />
                    <input
                      type="datetime-local"
                      value={formData.meetupTime}
                      onChange={(e) => setFormData({ ...formData, meetupTime: e.target.value })}
                      className="input-field text-xs py-2 bg-white"
                    />
                  </div>
                )}
              </div>
            </label>

            {/* Option 4: Keep Temporarily */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
              formData.returnAssistance === HANDOVER_METHODS.KEEP_TEMPORARILY
                ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="assistance"
                checked={formData.returnAssistance === HANDOVER_METHODS.KEEP_TEMPORARILY}
                onChange={() => setFormData({ ...formData, returnAssistance: HANDOVER_METHODS.KEEP_TEMPORARILY })}
                className="mt-1 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-800">
                  Hold Temporarily at Your Place
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Keep it safely with you until an owner files a claim or admin contacts you.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Post Found Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
