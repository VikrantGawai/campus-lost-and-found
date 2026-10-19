import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isDemoMode } from '../config/firebase';
import {
  DEMO_LOST_ITEMS,
  DEMO_FOUND_ITEMS,
  DEMO_CLAIMS,
  DEMO_HANDOVERS,
  DEMO_COLLECTION_POINTS,
  DEMO_AUDIT_LOG,
} from '../data/demoData';
import { ITEM_STATUSES, CLAIM_STATUSES, HANDOVER_STATUSES } from '../config/constants';
import { findMatches } from '../utils/matching';

const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

/** Try to load persisted demo state from localStorage */
function loadPersistedState(key, fallback) {
  if (!isDemoMode) return fallback;
  try {
    const saved = localStorage.getItem(`clf_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, data) {
  if (!isDemoMode) return;
  try {
    localStorage.setItem(`clf_${key}`, JSON.stringify(data));
  } catch { /* quota exceeded – ignore */ }
}

export function DataProvider({ children }) {
  const [lostItems, setLostItems] = useState(() =>
    loadPersistedState('lostItems', DEMO_LOST_ITEMS)
  );
  const [foundItems, setFoundItems] = useState(() =>
    loadPersistedState('foundItems', DEMO_FOUND_ITEMS)
  );
  const [claims, setClaims] = useState(() =>
    loadPersistedState('claims', DEMO_CLAIMS)
  );
  const [handovers, setHandovers] = useState(() =>
    loadPersistedState('handovers', DEMO_HANDOVERS)
  );
  const [collectionPoints, setCollectionPoints] = useState(() =>
    loadPersistedState('collectionPoints', DEMO_COLLECTION_POINTS)
  );
  const [auditLog, setAuditLog] = useState(() =>
    loadPersistedState('auditLog', DEMO_AUDIT_LOG)
  );

  // Persist changes to localStorage
  useEffect(() => { persist('lostItems', lostItems); }, [lostItems]);
  useEffect(() => { persist('foundItems', foundItems); }, [foundItems]);
  useEffect(() => { persist('claims', claims); }, [claims]);
  useEffect(() => { persist('handovers', handovers); }, [handovers]);
  useEffect(() => { persist('collectionPoints', collectionPoints); }, [collectionPoints]);
  useEffect(() => { persist('auditLog', auditLog); }, [auditLog]);

  // ─── Helper to add audit entry ────────────────────────────────
  const addAuditEntry = useCallback((action, userId, details) => {
    const entry = {
      id: `audit-${uuidv4()}`,
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [entry, ...prev]);
  }, []);

  // ─── Report Lost Item ────────────────────────────────────────
  const reportLostItem = useCallback((item, user) => {
    const now = new Date().toISOString();
    const newItem = {
      id: `lost-${uuidv4()}`,
      type: 'lost',
      userId: user.id,
      userName: user.name,
      ...item,
      status: ITEM_STATUSES.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    setLostItems((prev) => [newItem, ...prev]);
    addAuditEntry('item_reported', user.id, `Reported lost item: ${item.title}`);

    // Auto-match against found items
    const allFound = [...foundItems];
    const matches = findMatches(newItem, allFound);
    return { item: newItem, matches };
  }, [foundItems, addAuditEntry]);

  // ─── Report Found Item ───────────────────────────────────────
  const reportFoundItem = useCallback((item, user) => {
    const now = new Date().toISOString();
    const newItem = {
      id: `found-${uuidv4()}`,
      type: 'found',
      userId: user.id,
      userName: user.name,
      ...item,
      status: ITEM_STATUSES.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    setFoundItems((prev) => [newItem, ...prev]);
    addAuditEntry('item_reported', user.id, `Reported found item: ${item.title}`);

    // Auto-match against lost items
    const allLost = [...lostItems];
    const matches = findMatches(newItem, allLost);
    return { item: newItem, matches };
  }, [lostItems, addAuditEntry]);

  // ─── Update Item Status ──────────────────────────────────────
  const updateItemStatus = useCallback((itemId, newStatus, userId) => {
    const now = new Date().toISOString();
    const updateFn = (prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: newStatus, updatedAt: now } : item
      );
    setLostItems(updateFn);
    setFoundItems(updateFn);
    addAuditEntry('status_changed', userId, `Item ${itemId} status → ${newStatus}`);
  }, [addAuditEntry]);

  // ─── Submit Claim ─────────────────────────────────────────────
  const submitClaim = useCallback((claimData, user) => {
    // Prevent duplicate claims
    const exists = claims.some(
      (c) => c.itemId === claimData.itemId && c.claimantId === user.id && c.status === CLAIM_STATUSES.PENDING
    );
    if (exists) throw new Error('You already have a pending claim for this item.');

    const now = new Date().toISOString();
    const newClaim = {
      id: `claim-${uuidv4()}`,
      claimantId: user.id,
      claimantName: user.name,
      ...claimData,
      status: CLAIM_STATUSES.PENDING,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    setClaims((prev) => [newClaim, ...prev]);
    addAuditEntry('claim_submitted', user.id, `Submitted claim for item: ${claimData.itemTitle}`);
    return newClaim;
  }, [claims, addAuditEntry]);

  // ─── Review Claim ─────────────────────────────────────────────
  const reviewClaim = useCallback((claimId, decision, reviewNote, reviewerId) => {
    const now = new Date().toISOString();
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: decision,
              reviewNote,
              reviewedBy: reviewerId,
              reviewedAt: now,
              updatedAt: now,
            }
          : c
      )
    );
    addAuditEntry('claim_reviewed', reviewerId, `Claim ${claimId} → ${decision}`);
  }, [addAuditEntry]);

  // ─── Create Handover ─────────────────────────────────────────
  const createHandover = useCallback((handoverData, user) => {
    const now = new Date().toISOString();
    const newHandover = {
      id: `handover-${uuidv4()}`,
      ...handoverData,
      status: HANDOVER_STATUSES.REQUESTED,
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
      confirmedBy: null,
    };
    setHandovers((prev) => [newHandover, ...prev]);
    addAuditEntry('handover_created', user.id, `Handover requested for item: ${handoverData.itemTitle}`);
    return newHandover;
  }, [addAuditEntry]);

  // ─── Update Handover ─────────────────────────────────────────
  const updateHandover = useCallback((handoverId, updates, userId) => {
    const now = new Date().toISOString();
    setHandovers((prev) =>
      prev.map((h) =>
        h.id === handoverId ? { ...h, ...updates, updatedAt: now } : h
      )
    );
    addAuditEntry('handover_updated', userId, `Handover ${handoverId} updated: ${JSON.stringify(updates)}`);
  }, [addAuditEntry]);

  // ─── Collection Points ───────────────────────────────────────
  const addCollectionPoint = useCallback((pointData, userId) => {
    const newPoint = {
      id: `cp-${uuidv4()}`,
      ...pointData,
      isActive: true,
    };
    setCollectionPoints((prev) => [...prev, newPoint]);
    addAuditEntry('collection_point_added', userId, `Added collection point: ${pointData.name}`);
    return newPoint;
  }, [addAuditEntry]);

  const updateCollectionPoint = useCallback((pointId, updates, userId) => {
    setCollectionPoints((prev) =>
      prev.map((p) => (p.id === pointId ? { ...p, ...updates } : p))
    );
    addAuditEntry('collection_point_updated', userId, `Updated collection point: ${pointId}`);
  }, [addAuditEntry]);

  // ─── Get items by user ───────────────────────────────────────
  const getUserItems = useCallback((userId) => {
    return {
      lost: lostItems.filter((i) => i.userId === userId),
      found: foundItems.filter((i) => i.userId === userId),
    };
  }, [lostItems, foundItems]);

  const getUserClaims = useCallback((userId) => {
    return {
      submitted: claims.filter((c) => c.claimantId === userId),
      received: claims.filter((c) => {
        const item = foundItems.find((i) => i.id === c.itemId);
        return item && item.userId === userId;
      }),
    };
  }, [claims, foundItems]);

  const getUserHandovers = useCallback((userId) => {
    return handovers.filter(
      (h) => h.finderId === userId || h.volunteerId === userId
    );
  }, [handovers]);

  // ─── Reset demo data ─────────────────────────────────────────
  const resetDemoData = useCallback(() => {
    if (!isDemoMode) return;
    setLostItems(DEMO_LOST_ITEMS);
    setFoundItems(DEMO_FOUND_ITEMS);
    setClaims(DEMO_CLAIMS);
    setHandovers(DEMO_HANDOVERS);
    setCollectionPoints(DEMO_COLLECTION_POINTS);
    setAuditLog(DEMO_AUDIT_LOG);
    localStorage.removeItem('clf_lostItems');
    localStorage.removeItem('clf_foundItems');
    localStorage.removeItem('clf_claims');
    localStorage.removeItem('clf_handovers');
    localStorage.removeItem('clf_collectionPoints');
    localStorage.removeItem('clf_auditLog');
  }, []);

  // ─── Stats ────────────────────────────────────────────────────
  const stats = {
    activeLost: lostItems.filter((i) => i.status === ITEM_STATUSES.ACTIVE).length,
    activeFound: foundItems.filter((i) => i.status === ITEM_STATUSES.ACTIVE).length,
    totalMatched: [...lostItems, ...foundItems].filter((i) => i.status === ITEM_STATUSES.MATCHED).length,
    pendingHandovers: handovers.filter((h) =>
      [HANDOVER_STATUSES.REQUESTED, HANDOVER_STATUSES.ACCEPTED, HANDOVER_STATUSES.SCHEDULED].includes(h.status)
    ).length,
    pendingClaims: claims.filter((c) => c.status === CLAIM_STATUSES.PENDING).length,
    totalReturned: [...lostItems, ...foundItems].filter((i) => i.status === ITEM_STATUSES.RETURNED).length,
  };

  const value = {
    lostItems,
    foundItems,
    claims,
    handovers,
    collectionPoints,
    auditLog,
    stats,
    reportLostItem,
    reportFoundItem,
    updateItemStatus,
    submitClaim,
    reviewClaim,
    createHandover,
    updateHandover,
    addCollectionPoint,
    updateCollectionPoint,
    getUserItems,
    getUserClaims,
    getUserHandovers,
    resetDemoData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
