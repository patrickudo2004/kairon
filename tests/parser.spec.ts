import { test, expect } from '@playwright/test';
import { parseRundownText, detectSlotType, PRODUCTION_TEMPLATES } from '../utils/rundownParser';

test.describe('Smart Rundown Parser & Template Verification', () => {
  test('should parse bulleted and parenthetical WhatsApp order of service', () => {
    const rawText = `
ORDER OF SERVICE - SUNDAY 12TH OCTOBER
1. Opening Prayer - Pastor David (5 mins)
2. Praise & Worship - Kingdom Voices (25 mins)
3. Bible Reading: Psalm 23 - Sister Grace (5m)
> Scripture: Psalm 23:1-6
4. Choir Ministration - Youth Choir (7 mins)
5. Sermon: Walking in Dominion by Bishop David (45m)
6. Offering & Tithes (10 mins)
7. Prophetic Blessings (5 mins)
    `.trim();

    const result = parseRundownText(rawText);
    expect(result.slots.length).toBe(7);

    // Slot 1: Opening Prayer
    expect(result.slots[0].title).toBe('Opening Prayer');
    expect(result.slots[0].speaker).toBe('Pastor David');
    expect(result.slots[0].durationMinutes).toBe(5);
    expect(result.slots[0].type).toBe('Talk');

    // Slot 2: Praise & Worship
    expect(result.slots[1].title).toBe('Praise & Worship');
    expect(result.slots[1].speaker).toBe('Kingdom Voices');
    expect(result.slots[1].durationMinutes).toBe(25);
    expect(result.slots[1].type).toBe('Worship');

    // Slot 3: Bible Reading with detail/scripture
    expect(result.slots[2].title).toBe('Bible Reading');
    expect(result.slots[2].speaker).toBe('Sister Grace');
    expect(result.slots[2].durationMinutes).toBe(5);
    expect(result.slots[2].details).toContain('Psalm 23');

    // Slot 5: Sermon
    expect(result.slots[4].title).toBe('Sermon: Walking in Dominion');
    expect(result.slots[4].speaker).toBe('Bishop David');
    expect(result.slots[4].durationMinutes).toBe(45);
    expect(result.slots[4].type).toBe('Sermon');
  });

  test('should parse time range agenda format', () => {
    const rawText = `
09:00 - 09:30 | Registration & Coffee
09:30 - 10:15 | Opening Keynote by Sarah Connor
10:15 - 11:00 | Industry Panel Discussion
    `.trim();

    const result = parseRundownText(rawText);
    expect(result.slots.length).toBe(3);

    expect(result.slots[0].title).toBe('Registration & Coffee');
    expect(result.slots[0].durationMinutes).toBe(30);
    expect(result.slots[0].type).toBe('Break');

    expect(result.slots[1].title).toBe('Opening Keynote');
    expect(result.slots[1].speaker).toBe('Sarah Connor');
    expect(result.slots[1].durationMinutes).toBe(45);
    expect(result.slots[1].type).toBe('Keynote');

    expect(result.slots[2].title).toBe('Industry Panel Discussion');
    expect(result.slots[2].durationMinutes).toBe(45);
    expect(result.slots[2].type).toBe('Panel');
  });

  test('should provide valid production templates with positive durations', () => {
    expect(PRODUCTION_TEMPLATES.length).toBeGreaterThanOrEqual(4);

    for (const tmpl of PRODUCTION_TEMPLATES) {
      expect(tmpl.slots.length).toBeGreaterThan(0);
      expect(tmpl.startTime).toMatch(/^\d{2}:\d{2}$/);
      for (const slot of tmpl.slots) {
        expect(slot.title.length).toBeGreaterThan(0);
        expect(slot.durationMinutes).toBeGreaterThan(0);
        expect(slot.type).toBeTruthy();
      }
    }
  });
});
