import { FlashcardDeck, GeneratedStudyNote, SubjectPDF } from '../types';

const OFFLINE_VIEWED_NOTES_KEY = 'mca_offline_viewed_notes_v1';
const OFFLINE_NOTES_SNAPSHOT_KEY = 'mca_offline_notes_snapshot_v1';
const OFFLINE_FLASHCARDS_SNAPSHOT_KEY = 'mca_offline_flashcards_snapshot_v1';
const OFFLINE_VIEWED_PDFS_KEY = 'mca_offline_viewed_pdfs_v1';
const OFFLINE_SYNC_META_KEY = 'mca_offline_sync_meta_v1';

export interface OfflineSyncMeta {
  lastSyncedAt: string;
}

export interface OfflineCacheStats {
  viewedNotesCount: number;
  cachedNotesCount: number;
  cachedDecksCount: number;
  cachedCardsCount: number;
  cachedPdfsCount: number;
  lastSyncedAt: string | null;
  approximateSizeKB: number;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getOfflineViewedNoteIds(studentId: string): string[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<Record<string, string[]>>(
    localStorage.getItem(OFFLINE_VIEWED_NOTES_KEY),
    {}
  );
  return all[studentId] || [];
}

export function recordViewedStudyNote(studentId: string, note: GeneratedStudyNote): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const viewedMap = safeParse<Record<string, string[]>>(
      localStorage.getItem(OFFLINE_VIEWED_NOTES_KEY),
      {}
    );
    const current = viewedMap[studentId] || [];
    const updatedIds = [note.id, ...current.filter(id => id !== note.id)].slice(0, 60);
    viewedMap[studentId] = updatedIds;
    localStorage.setItem(OFFLINE_VIEWED_NOTES_KEY, JSON.stringify(viewedMap));

    const snapMap = safeParse<Record<string, GeneratedStudyNote[]>>(
      localStorage.getItem(OFFLINE_NOTES_SNAPSHOT_KEY),
      {}
    );
    const existing = snapMap[studentId] || [];
    snapMap[studentId] = [note, ...existing.filter(n => n.id !== note.id)];
    localStorage.setItem(OFFLINE_NOTES_SNAPSHOT_KEY, JSON.stringify(snapMap));

    updateOfflineSyncTimestamp(studentId);
    return updatedIds;
  } catch {
    return [];
  }
}

export function cacheAllStudyNotesOffline(studentId: string, notes: GeneratedStudyNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    const snapMap = safeParse<Record<string, GeneratedStudyNote[]>>(
      localStorage.getItem(OFFLINE_NOTES_SNAPSHOT_KEY),
      {}
    );
    snapMap[studentId] = notes;
    localStorage.setItem(OFFLINE_NOTES_SNAPSHOT_KEY, JSON.stringify(snapMap));
    updateOfflineSyncTimestamp(studentId);
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function getCachedStudyNotesOffline(studentId: string): GeneratedStudyNote[] {
  if (typeof window === 'undefined') return [];
  const snapMap = safeParse<Record<string, GeneratedStudyNote[]>>(
    localStorage.getItem(OFFLINE_NOTES_SNAPSHOT_KEY),
    {}
  );
  return snapMap[studentId] || [];
}

export function cacheFlashcardDecksOffline(studentId: string, decks: FlashcardDeck[]): void {
  if (typeof window === 'undefined') return;
  try {
    const snapMap = safeParse<Record<string, FlashcardDeck[]>>(
      localStorage.getItem(OFFLINE_FLASHCARDS_SNAPSHOT_KEY),
      {}
    );
    snapMap[studentId] = decks;
    localStorage.setItem(OFFLINE_FLASHCARDS_SNAPSHOT_KEY, JSON.stringify(snapMap));
    updateOfflineSyncTimestamp(studentId);
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function getCachedFlashcardDecksOffline(studentId: string): FlashcardDeck[] {
  if (typeof window === 'undefined') return [];
  const snapMap = safeParse<Record<string, FlashcardDeck[]>>(
    localStorage.getItem(OFFLINE_FLASHCARDS_SNAPSHOT_KEY),
    {}
  );
  return snapMap[studentId] || [];
}

export function cacheViewedPdfOffline(studentId: string, pdf: SubjectPDF): void {
  if (typeof window === 'undefined') return;
  try {
    const snapMap = safeParse<Record<string, SubjectPDF[]>>(
      localStorage.getItem(OFFLINE_VIEWED_PDFS_KEY),
      {}
    );
    const existing = snapMap[studentId] || [];
    snapMap[studentId] = [pdf, ...existing.filter(p => p.id !== pdf.id)].slice(0, 30);
    localStorage.setItem(OFFLINE_VIEWED_PDFS_KEY, JSON.stringify(snapMap));
    updateOfflineSyncTimestamp(studentId);
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function updateOfflineSyncTimestamp(studentId: string): string {
  const now = new Date().toISOString();
  if (typeof window === 'undefined') return now;
  try {
    const metaMap = safeParse<Record<string, OfflineSyncMeta>>(
      localStorage.getItem(OFFLINE_SYNC_META_KEY),
      {}
    );
    metaMap[studentId] = { lastSyncedAt: now };
    localStorage.setItem(OFFLINE_SYNC_META_KEY, JSON.stringify(metaMap));
  } catch {
    // Ignore storage quota errors gracefully
  }
  return now;
}

export function computeOfflineCacheStats(
  studentId: string,
  liveNotes: GeneratedStudyNote[],
  liveDecks: FlashcardDeck[],
  viewedNoteIds: string[],
  viewedPdfIds: string[]
): OfflineCacheStats {
  if (typeof window === 'undefined') {
    return {
      viewedNotesCount: viewedNoteIds.length,
      cachedNotesCount: liveNotes.length,
      cachedDecksCount: liveDecks.length,
      cachedCardsCount: liveDecks.reduce((acc, d) => acc + d.cards.length, 0),
      cachedPdfsCount: viewedPdfIds.length,
      lastSyncedAt: null,
      approximateSizeKB: 0,
    };
  }

  const metaMap = safeParse<Record<string, OfflineSyncMeta>>(
    localStorage.getItem(OFFLINE_SYNC_META_KEY),
    {}
  );
  const keys = [
    OFFLINE_VIEWED_NOTES_KEY,
    OFFLINE_NOTES_SNAPSHOT_KEY,
    OFFLINE_FLASHCARDS_SNAPSHOT_KEY,
    OFFLINE_VIEWED_PDFS_KEY,
    'mca_generated_study_notes_v1',
    'mca_flashcard_decks_v1',
  ];
  const totalBytes = keys.reduce((acc, k) => acc + (localStorage.getItem(k)?.length || 0) * 2, 0);

  return {
    viewedNotesCount: viewedNoteIds.length,
    cachedNotesCount: liveNotes.length,
    cachedDecksCount: liveDecks.length,
    cachedCardsCount: liveDecks.reduce((acc, d) => acc + d.cards.length, 0),
    cachedPdfsCount: viewedPdfIds.length,
    lastSyncedAt: metaMap[studentId]?.lastSyncedAt || null,
    approximateSizeKB: Math.max(1, Math.round(totalBytes / 1024)),
  };
}
