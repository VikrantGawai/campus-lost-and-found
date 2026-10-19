import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, Plus, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import ImageUpload from '../components/common/ImageUpload';
import ItemCard from '../components/common/ItemCard';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, CONTACT_METHODS, SENSITIVE_CATEGORIES } from '../config/constants';
import toast from 'react-hot-toast';

export default function ReportLost() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reportLostItem } = useData();
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    photoUrl: null,
    dateLost: new Date().toISOString().slice(0, 16),
    locations: [''],
    privateDetails: '',
    contactMethod: CONTACT_METHODS[0],
    notifyOnMatch: true,
  });

  const [errors, setErrors] = useState({});
  const [submittedResult, setSubmittedResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic locations handler
  const handleLocationChange = (index, value) => {
    const nextLocs = [...formData.locations];
    nextLocs[index] = value;
    setFormData({ ...formData, locations: nextLocs });
  };

  const addLocationSlot = () => {
    if (formData.locations.length < 5) {
      setFormData({ ...formData, locations: [...formData.locations, ''] });
    }
  };

  const removeLocationSlot = (index) => {
    if (formData.locations.length > 1) {
      const nextLocs = formData.locations.filter((_, i) => i !== index);
      setFormData({ ...formData, locations: nextLocs });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Item name is required.';
    if (!formData.category) errs.category = 'Please select a category.';
    if (!formData.description.trim()) errs.description = 'Public description is required.';
    else if (formData.description.trim().length < 15) {
      errs.description = 'Please provide at least 15 characters describing the item.';
    }

    const validLocations = formData.locations.filter((l) => l.trim());
    if (validLocations.length === 0) {
      errs.locations = 'Please select at least one possible campus location.';
    }

    if (!formData.dateLost) {
      errs.dateLost = 'Approximate date and time lost is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve the highlighted form errors.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanLocations = formData.locations.filter((l) => l.trim());
      const result = reportLostItem(
        {
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
          photoUrl: formData.photoUrl,
          dateLost: new Date(formData.dateLost).toISOString(),
          locations: cleanLocations,
          privateDetails: formData.privateDetails.trim() || null,
          contactMethod: formData.contactMethod,
          notifyOnMatch: formData.notifyOnMatch,
        },
        currentUser
      );

      // Trigger notification if matches found
      if (result.matches.length > 0 && formData.notifyOnMatch) {
        addNotification(
          currentUser.id,
          'match_found',
          'Possible Matches Found!',
          `Your lost report for "${formData.title}" has ${result.matches.length} possible matching item(s).`,
          result.item.id
        );
      }

      setSubmittedResult(result);
      toast.success('Lost item report filed successfully!');
    } catch (err) {
      toast.error('Failed to report item. ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSensitive = SENSITIVE_CATEGORIES.includes(formData.category);

  // If already submitted, display success screen + smart matches
  if (submittedResult) {
    const { item, matches } = submittedResult;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card text-center py-8">
          <CheckCircle2 className="w-14 h-14 text-teal-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-navy-800">Lost Item Reported Successfully!</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Your report is now active in the campus lost registry. If someone finds it or an authorized collection point logs it, you will be notified.
          </p>

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
                  dateLost: new Date().toISOString().slice(0, 16),
                  locations: [''],
                  privateDetails: '',
                  contactMethod: CONTACT_METHODS[0],
                  notifyOnMatch: true,
                });
              }}
              className="btn-secondary btn-sm"
            >
              Report Another Item
            </button>
          </div>
        </div>

        {/* Immediate Matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-navy-800">
                Possible Suggestions ({matches.length})
              </h3>
              <p className="text-xs text-gray-500">
                Rule-based suggestions based on category, keywords, location and timeline.
              </p>
            </div>
            {matches.length > 0 && (
              <button
                onClick={() => navigate('/matching')}
                className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
              >
                Full Matching Desk <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="card text-center py-8 text-gray-500 text-sm">
              No matching found items found yet. We will keep your report active and check as new found items are logged.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.item.id} className="card p-4 border-l-4 border-l-teal-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {m.score}% Match Suggestion
                    </span>
                    <button
                      onClick={() => navigate(`/item/${m.item.id}`)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Inspect &amp; Claim →
                    </button>
                  </div>
                  <ItemCard item={m.item} />
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-navy-700 uppercase tracking-wide">
                      Why this was suggested:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 mt-0.5 space-y-0.5">
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
        <h1 className="text-2xl font-bold text-navy-800">Report a Lost Item</h1>
        <p className="text-gray-500 text-sm mt-1">
          Submit details about what you lost. We will match it against current and future found items.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Navy Blue HP Laptop Sleeve, Black Sonata Watch"
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

        {/* Sensitive Notice */}
        {isSensitive && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Privacy Protected for Sensitive Belongings</p>
              <p className="mt-0.5">
                For IDs, wallets, phones or flash drives, never put sensitive numbers or passwords in public descriptions. Put them in the Private Ownership Evidence box below.
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
            placeholder="Describe visible features: color, shape, brand, stickers, keychains or exterior condition..."
            className="input-field"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            This will be visible to students browsing the campus registry.
          </p>
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Multiple Campus Locations */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-navy-700">
              Possible Campus Locations <span className="text-red-500">*</span>
            </label>
            {formData.locations.length < 5 && (
              <button
                type="button"
                onClick={addLocationSlot}
                className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add another location
              </button>
            )}
          </div>
          <div className="space-y-2">
            {formData.locations.map((loc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={loc}
                  onChange={(e) => handleLocationChange(idx, e.target.value)}
                  className="input-field text-sm py-2 flex-1"
                >
                  <option value="">Select a location where you might have lost it</option>
                  {CAMPUS_LOCATIONS.map((cLoc) => (
                    <option key={cLoc} value={cLoc}>{cLoc}</option>
                  ))}
                </select>
                {formData.locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocationSlot(idx)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    aria-label="Remove location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.locations && <p className="text-xs text-red-600 mt-1">{errors.locations}</p>}
        </div>

        {/* Date / Time Lost */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Approximate Date &amp; Time Lost <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.dateLost}
            onChange={(e) => setFormData({ ...formData, dateLost: e.target.value })}
            className="input-field"
          />
          {errors.dateLost && <p className="text-xs text-red-600 mt-1">{errors.dateLost}</p>}
        </div>

        {/* Photo Upload */}
        <ImageUpload
          value={formData.photoUrl}
          onChange={(val) => setFormData({ ...formData, photoUrl: val })}
          label="Optional Photo of Item or Model"
        />

        {/* Private Ownership Evidence */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-navy-700 mb-1">
            Private Ownership Evidence (Kept Confidential)
          </label>
          <textarea
            rows={2}
            value={formData.privateDetails}
            onChange={(e) => setFormData({ ...formData, privateDetails: e.target.value })}
            placeholder="Hidden identifying markings, engravings, serial number fragments, wallpaper descriptions, or specific internal contents..."
            className="input-field"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Strictly private. Only verified reviewers and collection desk staff can see this to confirm claims.
          </p>
        </div>

        {/* Contact & Notification Preferences */}
        <div className="pt-2 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Preferred Contact Method
            </label>
            <select
              value={formData.contactMethod}
              onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
              className="input-field text-sm"
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="notify"
              checked={formData.notifyOnMatch}
              onChange={(e) => setFormData({ ...formData, notifyOnMatch: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <label htmlFor="notify" className="text-xs text-navy-700">
              Notify me automatically when high-scoring matches are reported
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Lost Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
