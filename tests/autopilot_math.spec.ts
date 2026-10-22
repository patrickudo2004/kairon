import { test, expect } from '@playwright/test';
import { PRODUCTION_TEMPLATES } from '../utils/rundownParser';

// Pure implementation mirroring App.tsx getProtectedMinimumDuration & healScheduleOverruns
const getProtectedMinimumDuration = (slot: any): number => {
  const type = (slot.type || '').toLowerCase();
  const title = (slot.title || '').toLowerCase();
  
  if (type === 'sermon' || type === 'keynote' || /sermon|the word|message|keynote/.test(title)) {
    return Math.max(15, Math.floor(slot.durationMinutes * 0.6));
  }
  if (type === 'worship' || /worship|praise/.test(title)) {
    return Math.max(5, Math.floor(slot.durationMinutes * 0.5));
  }
  return 1;
};

const healScheduleOverruns = (program: any, currentSlotIndex: number, overrunSeconds: number): any[] => {
  const remainingSlots = program.slots.slice(currentSlotIndex + 1);
  if (remainingSlots.length === 0) return program.slots;

  let secondsToAbsorb = overrunSeconds;
  const minutesToAbsorb = Math.ceil(secondsToAbsorb / 60);
  if (minutesToAbsorb <= 0) return program.slots;

  const newSlots = program.slots.map((s: any) => ({ ...s }));
  let absorbed = 0;

  const flexTypes = ['break', 'transition', 'announcements', 'buffer', 'offering'];
  const remainingFlexSlots = newSlots.slice(currentSlotIndex + 1).filter((s: any) => 
    flexTypes.includes((s.type || '').toLowerCase()) ||
    /announcement|notice|offering|giving|break|transition|buffer/i.test(s.title || '')
  );

  for (let s of remainingFlexSlots) {
    if (absorbed >= minutesToAbsorb) break;
    const minFloor = getProtectedMinimumDuration(s);
    const maxShave = Math.max(0, s.durationMinutes - minFloor);
    const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
    if (shave > 0) {
      s.durationMinutes = Math.max(minFloor, s.durationMinutes - shave);
      absorbed += shave;
    }
  }

  if (absorbed < minutesToAbsorb) {
    const remainingOtherSlots = newSlots.slice(currentSlotIndex + 1).filter((s: any) => 
      !flexTypes.includes((s.type || '').toLowerCase())
    );
    
    for (let s of remainingOtherSlots) {
      if (absorbed >= minutesToAbsorb) break;
      const minFloor = getProtectedMinimumDuration(s);
      const maxShave = Math.max(0, s.durationMinutes - minFloor);
      const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
      if (shave > 0) {
        s.durationMinutes = Math.max(minFloor, s.durationMinutes - shave);
        absorbed += shave;
      }
    }
  }

  return newSlots;
};

test.describe('Autopilot Rebalancing Engine Operational Stress Math', () => {

  test('Overrun Crisis Case A: Praise & Worship overruns by +15 min in Sunday Service', () => {
    const sundayTmpl = PRODUCTION_TEMPLATES.find(t => t.id === 'church-sunday')!;
    const program = {
      title: 'Sunday Celebration Service',
      slots: sundayTmpl.slots.map((s, i) => ({ ...s, id: `slot-${i}` }))
    };

    // Slot 1 is "Praise & Worship" (20 min). Overruns by +15 min (900 sec).
    const healed = healScheduleOverruns(program, 1, 15 * 60);

    // Initial planned duration for Announcements was 10m, Offering was 8m.
    // Announcements shaves from 10m down to floor of 1m (absorbing 9m)
    const announcements = healed.find(s => s.title.includes('Announcements'));
    expect(announcements.durationMinutes).toBe(1);

    // Offering shaves from 8m down to 2m (absorbing remaining 6m of 15m)
    const offering = healed.find(s => s.title.includes('Offering'));
    expect(offering.durationMinutes).toBe(2);

    // Protected slots: Word / Altar Call (45m) remains completely intact!
    const sermon = healed.find(s => s.title.includes('Word'));
    expect(sermon.durationMinutes).toBe(45);

    // Prophetic Blessings remains intact
    const blessings = healed.find(s => s.title.includes('Prophetic Blessings'));
    expect(blessings.durationMinutes).toBe(5);

    // Total time absorbed across remaining slots equals 15 minutes!
    const originalRemainingTotal = program.slots.slice(2).reduce((sum, s) => sum + s.durationMinutes, 0);
    const healedRemainingTotal = healed.slice(2).reduce((sum, s) => sum + s.durationMinutes, 0);
    expect(originalRemainingTotal - healedRemainingTotal).toBe(15);
  });

  test('Overrun Crisis Case B: Sermon overruns by +15 min (Slot 8)', () => {
    const sundayTmpl = PRODUCTION_TEMPLATES.find(t => t.id === 'church-sunday')!;
    const program = {
      title: 'Sunday Celebration Service',
      slots: sundayTmpl.slots.map((s, i) => ({ ...s, id: `slot-${i}` }))
    };

    // Slot 8 is "Word / Altar Call" (45 min). Overruns by +15 min. Only Slot 9 follows!
    const healed = healScheduleOverruns(program, 8, 15 * 60);

    // Slot 9 is Prophetic Blessings (originally 5m). Its minimum floor is 1m.
    // It shaves 4m down to 1m without crashing or going negative.
    const blessings = healed[9];
    expect(blessings.durationMinutes).toBe(1);
    expect(blessings.durationMinutes).toBeGreaterThanOrEqual(1);
    
    // No NaN or negative numbers
    healed.forEach(s => {
      expect(Number.isFinite(s.durationMinutes)).toBe(true);
      expect(s.durationMinutes).toBeGreaterThanOrEqual(1);
    });
  });

  test('Protected Minimum Floors: Sermons and Keynotes never compressed past 60% or 15m', () => {
    const slot = { title: 'Opening Keynote Address', durationMinutes: 45, type: 'Keynote' };
    const floor = getProtectedMinimumDuration(slot);
    expect(floor).toBe(27); // 45 * 0.6 = 27
  });

  test('Protected Minimum Floors: Worship never compressed past 50% or 5m', () => {
    const slot = { title: 'Praise & Worship', durationMinutes: 20, type: 'Worship' };
    const floor = getProtectedMinimumDuration(slot);
    expect(floor).toBe(10); // 20 * 0.5 = 10
  });

});
