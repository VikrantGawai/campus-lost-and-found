import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Sparkles, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { findAllMatches } from '../utils/matching';
import ItemCard from '../components/common/ItemCard';
import EmptyState from '../components/common/EmptyState';

export default function SmartMatching() {
  const navigate = useNavigate();
  const { lostItems, foundItems } = useData();
  const [minScore, setMinScore] = useState(30);

  const matchedPairs = useMemo(() => {
    return findAllMatches(lostItems, foundItems);
  }, [lostItems, foundItems]);

  const filteredPairs = useMemo(() => {
    return matchedPairs
      .map((pair) => ({
        ...pair,
        matches: pair.matches.filter((m) => m.score >= minScore),
      }))
      .filter((pair) => pair.matches.length > 0);
  }, [matchedPairs, minScore]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-teal-600" /> Smart Matching Engine
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Transparent, rule-based matching combining category taxonomy, text keyword overlap, campus location proximity, and timeline overlap.
          </p>
        </div>

        {/* Filter threshold */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
          <label className="text-xs font-semibold text-navy-700 whitespace-nowrap">
            Min Similarity:
          </label>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-28 accent-teal-600"
          />
          <span className="text-xs font-bold text-teal-700 w-8">{minScore}%</span>
        </div>
      </div>

      {/* How it works info */}
      <div className="p-4 bg-navy-50 rounded-xl border border-navy-100 text-xs text-navy-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-navy-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Transparent Rule-Based Scoring
          </p>
          <p className="text-gray-600">
            Weighted breakdown: Category Match (35%) • Keyword Overlap (30%) • Campus Location (20%) • Date Proximity (15%). Matches are labelled as helpful suggestions, not definitive ownership conclusions.
          </p>
        </div>
        <div className="whitespace-nowrap font-medium text-teal-700">
          {filteredPairs.reduce((acc, p) => acc + p.matches.length, 0)} Active Suggestions
        </div>
      </div>

      {/* Matching list */}
      {filteredPairs.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Match Suggestions Above Threshold"
          message="No active lost and found reports currently surpass the similarity threshold. Adjust the slider or check back when new items are logged."
        />
      ) : (
        <div className="space-y-6">
          {filteredPairs.map((pair) => (
            <div key={pair.lostItem.id} className="card space-y-4">
              {/* Source Item Header */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge ${pair.lostItem.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                    Source: {pair.lostItem.type === 'lost' ? 'Lost Report' : 'Found Item'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ID: {pair.lostItem.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy-900">{pair.lostItem.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{pair.lostItem.description}</p>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Candidate Matches ({pair.matches.length}):
                </p>

                {pair.matches.map((m) => (
                  <div
                    key={m.item.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          m.score >= 60 ? 'bg-green-100 text-green-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {m.score}% Suggested Match
                        </span>
                        <span className="text-xs text-gray-500">
                          {m.item.type === 'lost' ? 'Lost item' : 'Found item'} reported by {m.item.userName}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/item/${m.item.id}`)}
                        className="btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto text-xs"
                      >
                        Inspect Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ItemCard item={m.item} />

                    {/* Transparent Explanations */}
                    <div className="pt-2 border-t border-gray-200/60 text-xs">
                      <p className="font-semibold text-navy-800 mb-1">Match Analysis &amp; Criteria:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        {m.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
