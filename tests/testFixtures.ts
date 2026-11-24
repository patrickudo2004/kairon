import type { BrowserContext, Page } from '@playwright/test';

export const TEST_SUNDAY_PROGRAM = {
  id: 'local-sunday-service',
  slug: 'local-sunday-service',
  title: 'Sunday Celebration Service',
  subtitle: 'Sample Worship Template (Test Fixture)',
  date: '2026-11-29',
  startTime: '09:00',
  endTime: '11:00',
  organizationId: 'local-workspace',
  isPublic: true,
  status: 'draft',
  isManualMode: false,
  isOnHold: false,
  currentSlotIndex: 0,
  isTimerActive: false,
  timerStartTimestamp: null,
  secondsElapsed: 0,
  slots: [
    { id: 'slot-sun-1', title: 'Opening Prayer', speaker: 'Minister / Leader', durationMinutes: 5, type: 'Prayer', details: 'Opening prayer', productionNotes: 'Pulpit mic active', prompterText: 'Welcome everyone to Sunday Service.' },
    { id: 'slot-sun-2', title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 20, type: 'Worship', details: 'Congregational worship', productionNotes: 'Full band scene', prompterText: 'Lead into praise and worship.' },
    { id: 'slot-sun-3', title: 'Bible Reading', speaker: 'Scripture Reader', durationMinutes: 5, type: 'Talk', details: 'Anchor passage', productionNotes: 'Lectern mic only', prompterText: 'Read today scripture passage.' },
    { id: 'slot-sun-4', title: 'Hymn', speaker: 'Worship Team', durationMinutes: 5, type: 'Music', details: 'Congregational hymn', productionNotes: 'Lyrics overlay', prompterText: 'Sing hymn stanzas 1 to 4.' },
    { id: 'slot-sun-5', title: 'Announcements & Testimonies', speaker: 'Host / MC', durationMinutes: 10, type: 'Talk', details: 'Weekly updates', productionNotes: 'Announcement slides', prompterText: 'Share upcoming announcements.' },
    { id: 'slot-sun-6', title: 'First Timers', speaker: 'Welcome Team', durationMinutes: 5, type: 'Talk', details: 'Guest welcome', productionNotes: 'House lights 80%', prompterText: 'Welcome our first-time guests.' },
    { id: 'slot-sun-7', title: 'Offering', speaker: 'Host / MC', durationMinutes: 10, type: 'Worship', details: 'Giving moment', productionNotes: 'Giving details lower-third', prompterText: 'Prepare tithes and offerings.' },
    { id: 'slot-sun-8', title: 'Choir Ministration', speaker: 'Choir', durationMinutes: 8, type: 'Music', details: 'Special song', productionNotes: 'Choir overhead mics', prompterText: 'Special choral ministration.' },
    { id: 'slot-sun-9', title: 'Word / Altar Call', speaker: 'Lead Speaker', durationMinutes: 45, type: 'Sermon', details: 'Main sermon', productionNotes: 'Headset mic + stage clock', prompterText: 'Main teaching and altar call.' },
    { id: 'slot-sun-10', title: 'Prophetic Blessings & Closing', speaker: 'Lead Speaker', durationMinutes: 7, type: 'Prayer', details: 'Closing benediction', productionNotes: 'Outro music cue', prompterText: 'Receive closing blessings.' },
  ],
};

export const TEST_MIDWEEK_PROGRAM = {
  id: 'local-midweek-service',
  slug: 'local-midweek-service',
  title: 'Midweek Communion Service',
  subtitle: 'Sample Midweek Template (Test Fixture)',
  date: '2026-11-25',
  startTime: '18:00',
  endTime: '19:45',
  organizationId: 'local-workspace',
  isPublic: true,
  status: 'draft',
  isManualMode: false,
  isOnHold: false,
  currentSlotIndex: 0,
  isTimerActive: false,
  timerStartTimestamp: null,
  secondsElapsed: 0,
  slots: [
    { id: 'slot-mid-1', title: 'Opening Prayer', speaker: 'Service Host', durationMinutes: 5, type: 'Prayer' },
    { id: 'slot-mid-2', title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 15, type: 'Worship' },
    { id: 'slot-mid-3', title: 'Intercession 1–3', speaker: 'Prayer Leader', durationMinutes: 15, type: 'Prayer' },
    { id: 'slot-mid-4', title: 'Announcements & Testimony', speaker: 'Host / MC', durationMinutes: 10, type: 'Talk' },
    { id: 'slot-mid-5', title: 'Intercession 4–6', speaker: 'Prayer Leader', durationMinutes: 15, type: 'Prayer' },
    { id: 'slot-mid-6', title: 'Personal Supplication', speaker: 'Congregation', durationMinutes: 5, type: 'Prayer' },
    { id: 'slot-mid-7', title: 'Offering', speaker: 'Host / MC', durationMinutes: 5, type: 'Worship' },
    { id: 'slot-mid-8', title: 'High Praise', speaker: 'Worship Team', durationMinutes: 10, type: 'Worship' },
    { id: 'slot-mid-9', title: 'Word / Altar Call', speaker: 'Lead Speaker', durationMinutes: 25, type: 'Sermon' },
    { id: 'slot-mid-10', title: 'Communion & Blessing', speaker: 'Lead Speaker', durationMinutes: 10, type: 'Communion' },
    { id: 'slot-mid-11', title: 'Closing Remarks', speaker: 'Service Host', durationMinutes: 5, type: 'Talk' },
  ],
};

/**
 * Injects deterministic test-only programs into localStorage for Playwright E2E specs.
 * Production code intentionally ships with zero hardcoded sample/church programs.
 */
export async function seedTestWorkspace(target: Page | BrowserContext, programs = [TEST_SUNDAY_PROGRAM, TEST_MIDWEEK_PROGRAM]) {
  await target.addInitScript((progs) => {
    localStorage.setItem('kairon_booth_mode', 'true');
    localStorage.setItem('kairon_offline_programs', JSON.stringify(progs));
    localStorage.setItem('test_programs', JSON.stringify(progs));
    for (const p of progs) {
      localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(p));
    }
    if (progs[0]) {
      localStorage.setItem('kairon_program', JSON.stringify(progs[0]));
    }
  }, programs);
}
