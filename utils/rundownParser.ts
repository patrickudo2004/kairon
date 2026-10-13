import { Slot, SlotType } from '../types';

export interface ParsedRundownResult {
  title?: string;
  startTime?: string;
  endTime?: string;
  slots: Slot[];
}

export interface RundownTemplate {
  id: string;
  name: string;
  description: string;
  startTime: string;
  slots: Omit<Slot, 'id'>[];
}

// Built-in Production Rundown Templates
export const PRODUCTION_TEMPLATES: RundownTemplate[] = [
  {
    id: 'wcm-sunday',
    name: 'Sunday Service (Winners Chapel)',
    description: '10-part standard Sunday broadcast rundown with praise, announcements, choir, and sermon',
    startTime: '09:00',
    slots: [
      { title: 'Opening Prayer', speaker: 'Deacon / Pastor', durationMinutes: 5, type: 'Talk', details: 'Thanksgiving for God\'s faithfulness and open heavens' },
      { title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 25, type: 'Worship', details: 'High praise and intense worship into God\'s presence' },
      { title: 'Bible Reading', speaker: 'Scripture Reader', durationMinutes: 5, type: 'Talk', details: 'Monthly prophetic focus scripture' },
      { title: 'Hymn', speaker: 'Congregation', durationMinutes: 7, type: 'Music', details: 'Church hymnal' },
      { title: 'Announcements & Testimonies', speaker: 'Media / Announcements', durationMinutes: 15, type: 'Talk', details: 'Weekly broadcast video notices and recorded testimonies' },
      { title: 'First Timers Welcome', speaker: 'Hospitality', durationMinutes: 5, type: 'Talk', details: 'Welcoming first-time worshippers' },
      { title: 'Offering & Tithes', speaker: 'Pastor', durationMinutes: 10, type: 'Talk', details: 'Covenant day of prosperity ministration' },
      { title: 'Choir Ministration', speaker: 'Kingdom Voices Choir', durationMinutes: 7, type: 'Music', details: 'Special anthem / choir presentation' },
      { title: 'The Word / Altar Call', speaker: 'Resident Pastor', durationMinutes: 45, type: 'Sermon', details: 'Prophetic sermon delivery and altar call for salvation' },
      { title: 'Prophetic Blessings & Closing', speaker: 'Resident Pastor', durationMinutes: 6, type: 'Talk', details: 'Declaration of blessings and shared grace' }
    ]
  },
  {
    id: 'wcm-midweek',
    name: 'Midweek Communion Service (Wednesday)',
    description: '11-part intercessory prayer, high praise, word, and holy communion service',
    startTime: '18:30',
    slots: [
      { title: 'Opening Prayer', speaker: 'Minister', durationMinutes: 5, type: 'Talk', details: 'Thanksgiving for preserved lives' },
      { title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 15, type: 'Worship', details: 'Midweek praise ministration' },
      { title: 'Intercession 1–3', speaker: 'Prayer Leader', durationMinutes: 15, type: 'Talk', details: 'Prayers for church growth and impact' },
      { title: 'Announcements & Testimonies', speaker: 'Minister', durationMinutes: 10, type: 'Talk', details: 'Testimonies of answered prayers' },
      { title: 'Intercession 4–6', speaker: 'Prayer Leader', durationMinutes: 15, type: 'Talk', details: 'Prayers for members and the nation' },
      { title: 'Personal Supplication', speaker: 'Congregation', durationMinutes: 5, type: 'Talk', details: 'Individual petitions before God' },
      { title: 'Offering', speaker: 'Minister', durationMinutes: 7, type: 'Talk', details: 'Midweek worship offering' },
      { title: 'High Praise', speaker: 'Worship Team', durationMinutes: 8, type: 'Music', details: 'Celebration and dance before the Word' },
      { title: 'The Word & Teaching', speaker: 'Pastor', durationMinutes: 30, type: 'Sermon', details: 'Midweek scripture exposition' },
      { title: 'Holy Communion & Blessing', speaker: 'Pastor', durationMinutes: 10, type: 'Talk', details: 'Breaking of bread and communion administration' },
      { title: 'Closing Remarks & Grace', speaker: 'Pastor', durationMinutes: 5, type: 'Talk', details: 'Benediction and fellowship' }
    ]
  },
  {
    id: 'corporate-conference',
    name: 'Conference / Summit Schedule',
    description: 'Keynotes, panel discussion, break, and workshop',
    startTime: '09:00',
    slots: [
      { title: 'Registration & Welcome Coffee', speaker: 'Organizers', durationMinutes: 30, type: 'Break', details: 'Badge pickup and morning refreshments' },
      { title: 'Opening Keynote Address', speaker: 'Keynote Speaker', durationMinutes: 45, type: 'Keynote', details: 'State of the industry and vision for the summit' },
      { title: 'Executive Panel Discussion', speaker: 'Panelists & Moderator', durationMinutes: 45, type: 'Panel', details: 'Q&A and interactive panel discourse' },
      { title: 'Networking Break & Demos', speaker: 'Attendees', durationMinutes: 20, type: 'Break', details: 'Sponsor booth exhibition' },
      { title: 'Deep-Dive Workshop', speaker: 'Workshop Lead', durationMinutes: 60, type: 'Talk', details: 'Hands-on practical session' },
      { title: 'Closing Remarks & Next Steps', speaker: 'Conference Chair', durationMinutes: 15, type: 'Talk', details: 'Wrap-up and feedback collection' }
    ]
  },
  {
    id: 'wedding-ceremony',
    name: 'Wedding Ceremony',
    description: 'Prelude, processional, vows, rings, and recessional',
    startTime: '13:00',
    slots: [
      { title: 'Guest Arrival & Prelude Music', speaker: 'Pianist / Strings', durationMinutes: 30, type: 'Music', details: 'Atmospheric seating music' },
      { title: 'Processional & Bridal Entry', speaker: 'Wedding Party', durationMinutes: 10, type: 'Music', details: 'Bridesmaids and bridal entrance' },
      { title: 'Welcome & Convocation', speaker: 'Officiant', durationMinutes: 5, type: 'Talk', details: 'Opening declaration of holy matrimony' },
      { title: 'Exchange of Vows & Rings', speaker: 'Couple & Officiant', durationMinutes: 15, type: 'Talk', details: 'Sacred covenants and ring blessing' },
      { title: 'Pronouncement & Blessing', speaker: 'Officiant', durationMinutes: 5, type: 'Talk', details: 'Pronouncement of marriage' },
      { title: 'Signing of Marriage Register', speaker: 'Couple & Witnesses', durationMinutes: 10, type: 'Music', details: 'Legal register signing with musical accompaniment' },
      { title: 'Presentation & Recessional', speaker: 'New Couple', durationMinutes: 5, type: 'Music', details: 'Recessional out to reception' }
    ]
  }
];

// Heuristic keyword matcher for SlotType presets
export function detectSlotType(title: string, speaker?: string): SlotType {
  const combined = `${title} ${speaker || ''}`.toLowerCase();
  
  if (/praise|worship|hymn|singing|choir|song|chorus|instrumental|band|anthem/.test(combined)) {
    return 'Worship';
  }
  if (/word|sermon|message|preach|altar call|teaching|exhortation/.test(combined)) {
    return 'Sermon';
  }
  if (/keynote|inaugural|presidential/.test(combined)) {
    return 'Keynote';
  }
  if (/panel|discussion|roundtable|q&a|fireside/.test(combined)) {
    return 'Panel';
  }
  if (/break|lunch|tea|coffee|refreshment|recess|networking|intermission/.test(combined)) {
    return 'Break';
  }
  if (/music|solo|violin|orchestra|organ|recital/.test(combined)) {
    return 'Music';
  }
  return 'Talk';
}

/**
 * Fast, deterministic local regex text parser for orders of service.
 * Parses lines from WhatsApp, Word, email, and bullet points with zero API latency or token cost.
 */
export function parseRundownText(rawText: string): ParsedRundownResult {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const slots: Slot[] = [];
  let detectedTitle: string | undefined;
  let detectedStartTime: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect high-level event title if it's the first line and uppercase or tagged
    if (i === 0 && !/\d+\s*(?:m|min|mins|minutes|\:)/i.test(line) && line.length < 80) {
      if (/order of service|sunday|service|program|agenda|rundown|conference|summit/i.test(line)) {
        detectedTitle = line.replace(/^[#\*\-=\s]+|[#\*\-=\s]+$/g, '').trim();
        continue;
      }
    }

    // Try parsing line as a slot
    const slot = parseLineToSlot(line);
    if (slot) {
      // Check if subsequent line is an indented note or scripture detail
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (
          /^(?:scripture|note|theme|details?|readings?|focus|agenda)\s*[:\-]/i.test(nextLine) ||
          /^[>•\-\*]\s*(?:scripture|readings?)/i.test(nextLine)
        ) {
          const detailContent = nextLine.replace(/^[>•\-\*#\s]*(?:scripture|note|theme|details?|readings?|focus|agenda)\s*[:\-]?\s*/i, '').trim();
          slot.details = slot.details ? `${slot.details} | ${detailContent}` : detailContent;
          i++; // Consume next line
        }
      }
      slots.push(slot);
    }
  }

  return {
    title: detectedTitle,
    startTime: detectedStartTime,
    slots
  };
}

function parseLineToSlot(line: string): Slot | null {
  // Strip common leading list numbers/bullets: "1.", "1)", "[1]", "-", "*", "•", "#"
  let clean = line.replace(/^(?:(?:\d+[\.\)])|(?:\(\d+\))|(?:\[\d+\])|(?:[\-\*•#\>]))\s*/, '').trim();
  if (!clean) return null;

  let durationMinutes = 10; // Sensible default
  let speaker = '';
  let details = '';

  // 1. Check for explicit time range e.g. "10:00 - 10:25" or "10:00am - 10:25am"
  const timeRangeMatch = clean.match(/^(\d{1,2}:\d{2}(?:\s*[ap]m)?)\s*(?:-|–|to)\s*(\d{1,2}:\d{2}(?:\s*[ap]m)?)\s*[:\|–-]?\s*/i);
  if (timeRangeMatch) {
    const startStr = timeRangeMatch[1];
    const endStr = timeRangeMatch[2];
    const dur = calculateDurationFromTimes(startStr, endStr);
    if (dur > 0) {
      durationMinutes = dur;
    }
    clean = clean.replace(timeRangeMatch[0], '').trim();
  } else {
    // 2. Check for explicit parenthetical or bracketed duration:
    // e.g. "(15 mins)", "(15m)", "[20 min]", "15mins", "20 mins"
    const durMatch = clean.match(/(?:[\(\[\{]|\b)(\d{1,3})\s*(?:m|min|mins|minute|minutes)(?:[\)\]\}]|\b)/i);
    if (durMatch) {
      durationMinutes = Math.max(1, parseInt(durMatch[1], 10) || 10);
      // Remove duration text from the line
      clean = clean.replace(durMatch[0], '').replace(/\(\s*\)|\[\s*\]/g, '').trim();
    }
  }

  // 3. Check for speaker:
  // Patterns:
  // "Title - Speaker"
  // "Title by Speaker"
  // "Title | Speaker"
  // "Title : Speaker"
  // "Title (Speaker)"
  let title = clean;

  const speakerByMatch = title.match(/\b(?:by|with|led by)\s+([A-Z][A-Za-z0-9\s\.\&'-]+)$/i);
  if (speakerByMatch) {
    speaker = speakerByMatch[1].trim();
    title = title.substring(0, speakerByMatch.index).trim();
  } else {
    const delimiterMatch = title.match(/\s*(?:\||–|-)\s*([A-Za-z0-9\s\.\&',-]+)$/);
    if (delimiterMatch) {
      const candidate = delimiterMatch[1].trim();
      // If candidate looks like a speaker name or group
      if (
        /^(?:pastor|minister|brother|bro|sister|sis|deacon|elder|choir|band|rev|dr|bishop|pco|host|guest|team)\b/i.test(candidate) ||
        (candidate.split(' ').length <= 4 && !/prayer|scripture|reading|worship|offering|communion/i.test(candidate))
      ) {
        speaker = candidate;
        title = title.substring(0, delimiterMatch.index).trim();
      }
    }
  }

  // Check for scripture reference in title (e.g. "Bible Reading: Psalm 23" or "Exhortation - Romans 8:28")
  const scriptureMatch = title.match(/(?:[:\-]\s*)?(?:psalms?|genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|proverbs|ecclesiastes|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\s*[:\s]*([0-9A-Za-z\s:,-]+)$/i);
  if (scriptureMatch) {
    details = scriptureMatch[0].replace(/^[:\-\s]+/, '').trim();
    const candidateTitle = title.substring(0, scriptureMatch.index).trim();
    if (candidateTitle.length >= 2) {
      title = candidateTitle;
    }
  }

  // Clean trailing punctuation
  title = title.replace(/[:\-–—\|\s]+$/, '').trim();

  // If title became empty, restore clean
  if (!title) {
    title = clean;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    speaker,
    durationMinutes,
    type: detectSlotType(title, speaker),
    details: details || undefined
  };
}

function calculateDurationFromTimes(startStr: string, endStr: string): number {
  const start = parseTimeString(startStr);
  const end = parseTimeString(endStr);
  if (start === null || end === null) return 0;
  
  let diff = end - start;
  if (diff < 0) {
    diff += 24 * 60; // Next day rollover
  }
  return diff;
}

function parseTimeString(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]m)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}
