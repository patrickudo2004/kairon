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
    id: 'church-sunday',
    name: 'Sunday Church Service',
    description: '10-part Sunday service rundown with praise, announcements, offering, choir, and sermon',
    startTime: '09:00',
    slots: [
      { title: 'Opening Prayer', speaker: 'Minister / Leader', durationMinutes: 5, type: 'Talk', details: 'Thanksgiving for God\'s faithfulness and open heavens' },
      { title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 25, type: 'Worship', details: 'High praise and congregational worship' },
      { title: 'Scripture Reading', speaker: 'Scripture Reader', durationMinutes: 5, type: 'Talk', details: 'Weekly sermon focus passage' },
      { title: 'Congregational Hymn', speaker: 'Worship Team', durationMinutes: 7, type: 'Music', details: 'Hymn of devotion' },
      { title: 'Announcements & Welcome', speaker: 'Host / MC', durationMinutes: 10, type: 'Talk', details: 'Community notices and welcome to first-time guests' },
      { title: 'Tithes & Offering', speaker: 'Minister', durationMinutes: 10, type: 'Talk', details: 'Worship through giving and prayer of blessing' },
      { title: 'Special Ministration', speaker: 'Choir / Soloist', durationMinutes: 7, type: 'Music', details: 'Special musical selection or choir anthem' },
      { title: 'The Sermon / Altar Call', speaker: 'Lead Pastor / Speaker', durationMinutes: 40, type: 'Sermon', details: 'Main message delivery and invitation for prayer' },
      { title: 'Final Blessing & Closing', speaker: 'Lead Pastor', durationMinutes: 6, type: 'Talk', details: 'Benediction and dismissal' }
    ]
  },
  {
    id: 'church-midweek',
    name: 'Midweek Service',
    description: 'Midweek prayer, praise, word, and communion service',
    startTime: '18:30',
    slots: [
      { title: 'Opening Prayer', speaker: 'Leader', durationMinutes: 5, type: 'Talk', details: 'Thanksgiving and dedication' },
      { title: 'Praise & Worship', speaker: 'Worship Team', durationMinutes: 15, type: 'Worship', details: 'Midweek praise ministration' },
      { title: 'Intercessory Prayer Session', speaker: 'Prayer Leader', durationMinutes: 15, type: 'Talk', details: 'Corporate petitions and intercessions' },
      { title: 'Testimonies & Notices', speaker: 'Host', durationMinutes: 8, type: 'Talk', details: 'Testimonies and weekly highlights' },
      { title: 'Offering', speaker: 'Leader', durationMinutes: 7, type: 'Talk', details: 'Midweek offering and thanksgiving' },
      { title: 'Exhortation & Teaching', speaker: 'Pastor / Teacher', durationMinutes: 30, type: 'Sermon', details: 'Bible study and practical teaching' },
      { title: 'Communion & Benediction', speaker: 'Pastor', durationMinutes: 10, type: 'Talk', details: 'Breaking of bread and final blessings' }
    ]
  },
  {
    id: 'corporate-conference',
    name: 'Corporate Summit / Conference',
    description: 'Keynotes, fireside chats, panel discussions, break, and Q&A',
    startTime: '09:00',
    slots: [
      { title: 'Registration & Welcome Coffee', speaker: 'Organizers', durationMinutes: 30, type: 'Break', details: 'Badge pickup and morning networking' },
      { title: 'Opening Keynote Address', speaker: 'Keynote Speaker', durationMinutes: 45, type: 'Keynote', details: 'State of the industry and summit vision' },
      { title: 'Executive Panel Discussion', speaker: 'Panelists & Moderator', durationMinutes: 45, type: 'Panel', details: 'Interactive panel debate with audience Q&A' },
      { title: 'Networking Break & Demos', speaker: 'Attendees', durationMinutes: 20, type: 'Break', details: 'Sponsor booth exhibition' },
      { title: 'Fireside Chat & Deep-Dive', speaker: 'Guest Leader', durationMinutes: 40, type: 'Talk', details: 'Unscripted executive conversation' },
      { title: 'Closing Remarks & Awards', speaker: 'Conference Chair', durationMinutes: 15, type: 'Talk', details: 'Wrap-up, summary, and evening reception details' }
    ]
  },
  {
    id: 'wedding-ceremony',
    name: 'Wedding Ceremony',
    description: 'Prelude, processional, vows, rings, signing, and recessional',
    startTime: '13:00',
    slots: [
      { title: 'Guest Arrival & Prelude', speaker: 'Pianist / Strings', durationMinutes: 30, type: 'Music', details: 'Seating background music' },
      { title: 'Processional & Bridal Entry', speaker: 'Bridal Party', durationMinutes: 10, type: 'Music', details: 'Processional entrance' },
      { title: 'Welcome & Convocation', speaker: 'Officiant', durationMinutes: 5, type: 'Talk', details: 'Opening declaration of holy matrimony' },
      { title: 'Exchange of Vows & Rings', speaker: 'Couple & Officiant', durationMinutes: 15, type: 'Talk', details: 'Sacred covenants and ring blessings' },
      { title: 'Signing of Marriage Register', speaker: 'Couple & Witnesses', durationMinutes: 10, type: 'Music', details: 'Legal register signing with musical accompaniment' },
      { title: 'Pronouncement & Presentation', speaker: 'Officiant', durationMinutes: 5, type: 'Talk', details: 'Pronouncement of marriage' },
      { title: 'Recessional', speaker: 'New Couple', durationMinutes: 5, type: 'Music', details: 'Recessional out to reception' }
    ]
  },
  {
    id: 'product-book-launch',
    name: 'Product / Book Launch',
    description: 'Red carpet arrival, teaser video, keynote, unveiling, and signing',
    startTime: '18:00',
    slots: [
      { title: 'Arrival & Welcome Drinks', speaker: 'Host / MC', durationMinutes: 30, type: 'Break', details: 'Red carpet photography and mingling' },
      { title: 'Welcome & Opening Remarks', speaker: 'Host', durationMinutes: 10, type: 'Talk', details: 'Context and introduction of the work' },
      { title: 'Product / Book Teaser Video', speaker: 'AV Media Booth', durationMinutes: 5, type: 'Video', details: 'Official cinematic trailer presentation' },
      { title: 'Author / Founder Keynote', speaker: 'Author / Creator', durationMinutes: 25, type: 'Keynote', details: 'The journey, inspiration, and core message' },
      { title: 'Official Unveiling Ceremony', speaker: 'Dignitaries & Author', durationMinutes: 10, type: 'Talk', details: 'Unveiling the cover/product with photo-op' },
      { title: 'Panel Discussion & Q&A', speaker: 'Author & Guest Reviewers', durationMinutes: 25, type: 'Panel', details: 'Audience questions and critique' },
      { title: 'Book Signing & Networking', speaker: 'Author & Attendees', durationMinutes: 30, type: 'Break', details: 'Exclusive book signing session' }
    ]
  },
  {
    id: 'memorial-funeral',
    name: 'Memorial / Funeral Service',
    description: 'Prelude, tributes, scripture reading, sermon, and committal',
    startTime: '11:00',
    slots: [
      { title: 'Prelude & Seating', speaker: 'Organist / Choir', durationMinutes: 20, type: 'Music', details: 'Reflective hymns and seating of mourners' },
      { title: 'Opening Prayer & Hymn', speaker: 'Officiating Minister', durationMinutes: 8, type: 'Talk', details: 'Opening invocation and congregational hymn' },
      { title: 'Biography & Family Tributes', speaker: 'Family Representatives', durationMinutes: 20, type: 'Talk', details: 'Reading of life story and personal reflections' },
      { title: 'Scripture Readings', speaker: 'Family Member', durationMinutes: 5, type: 'Talk', details: 'Comforting passages (Psalm 23 / 1 Cor 15)' },
      { title: 'Choir Selection / Solo', speaker: 'Choir', durationMinutes: 5, type: 'Music', details: 'Song of comfort and hope' },
      { title: 'Funeral Sermon / Exhortation', speaker: 'Officiating Minister', durationMinutes: 20, type: 'Sermon', details: 'Message of eternal hope and resurrection' },
      { title: 'Benediction & Procession', speaker: 'Officiating Minister', durationMinutes: 7, type: 'Talk', details: 'Final committal prayer and recessional' }
    ]
  },
  {
    id: 'awards-gala',
    name: 'Awards & Gala Dinner',
    description: 'Cocktail arrival, dinner, live entertainment, award presentations, and closing',
    startTime: '19:00',
    slots: [
      { title: 'Red Carpet & Cocktail Reception', speaker: 'Guests & Press', durationMinutes: 45, type: 'Break', details: 'Cocktails and arrival photos' },
      { title: 'Opening Address & Welcome', speaker: 'Gala Host / MC', durationMinutes: 10, type: 'Talk', details: 'Welcome to the awards evening' },
      { title: 'Dinner Service & Background Music', speaker: 'Live Band / Orchestra', durationMinutes: 50, type: 'Music', details: 'Dinner course served' },
      { title: 'Keynote & Special Feature', speaker: 'Guest of Honor', durationMinutes: 15, type: 'Keynote', details: 'Inspiring keynote address' },
      { title: 'Award Presentations (Categories 1–5)', speaker: 'Presenters & Winners', durationMinutes: 40, type: 'Talk', details: 'Trophy presentations and acceptance speeches' },
      { title: 'Headline Entertainment', speaker: 'Guest Artist / Performer', durationMinutes: 20, type: 'Music', details: 'Live musical showcase' },
      { title: 'Vote of Thanks & After-Party', speaker: 'Gala Host', durationMinutes: 10, type: 'Talk', details: 'Closing remarks and dance floor open' }
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
