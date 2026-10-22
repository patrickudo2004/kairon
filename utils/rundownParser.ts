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

// Built-in Production Rundown Templates (Enriched with Crew Cues & Stage Teleprompter Scripts)
export const PRODUCTION_TEMPLATES: RundownTemplate[] = [
  {
    id: 'church-sunday',
    name: 'Sunday Church Service',
    description: '10-part Sunday service rundown (Winners Chapel canonical order of service)',
    startTime: '09:00',
    slots: [
      {
        title: 'Opening Prayer',
        speaker: 'Minister / Leader',
        durationMinutes: 5,
        type: 'Prayer',
        details: "Thanksgiving for God's faithfulness and open heavens",
        productionNotes: 'SOUND: Unmute Pulpit Mic 1 + Keyboard warm pad | LIGHTS: Stage Warm Wash 70%, House 40% | VIDEO: Wide Shot (Cam 1) + Lower-Third Title',
        prompterText: 'Welcome to Sunday Service! Let us rise on our feet and lift up our voices in thanksgiving unto the Lord for His faithfulness, mercy, and open heavens over this service.'
      },
      {
        title: 'Praise & Worship',
        speaker: 'Worship Team',
        durationMinutes: 20,
        type: 'Worship',
        details: 'High praise and congregational worship',
        productionNotes: 'SOUND: Full Band Scene + Lead Vocal + BGVs | LIGHTS: Dynamic Concert Praise Scene | VIDEO: Multi-Cam Cut + Lyrics Overlay via ProPresenter',
        prompterText: 'Praise Team leading high praise into deep worship. Encourage the congregation to celebrate with joy and expectation.'
      },
      {
        title: 'Bible Reading',
        speaker: 'Scripture Reader',
        durationMinutes: 5,
        type: 'Talk',
        details: 'Weekly sermon focus passage',
        productionNotes: 'SOUND: Lectern Mic ONLY (Mute Band) | LIGHTS: Clean Pulpit Key Light | VIDEO: Tight Shot (Cam 2) + Side-by-Side Scripture Graphic',
        prompterText: 'Please open your Bibles with me to today\'s anchor scripture. Read clearly and deliberately, pausing between verses for the congregation to follow.'
      },
      {
        title: 'Hymn',
        speaker: 'Worship Team',
        durationMinutes: 5,
        type: 'Music',
        details: 'Hymn of devotion',
        productionNotes: 'SOUND: Organ/Keys + Worship Leader | LIGHTS: Classic Gold & Blue Wash | VIDEO: Full-Screen Hymn Stanzas on Side Screens & Stream',
        prompterText: 'Let us remain standing as we sing our congregational hymn together with all our hearts.'
      },
      {
        title: 'Announcements & Testimonies',
        speaker: 'Host / MC',
        durationMinutes: 10,
        type: 'Talk',
        details: 'Notices, church highlights, and documented praise reports',
        productionNotes: 'SOUND: Handheld Wireless Mic 2 + Video Playback Audio Ready | LIGHTS: Bright Stage + House 50% | VIDEO: Roll Video News / Announcement Slides',
        prompterText: 'Welcome again! Listen closely to our weekly church highlights and documented testimonies of God\'s wonder-working power in our midst.'
      },
      {
        title: 'First Timers',
        speaker: 'Host / Welcome Team',
        durationMinutes: 5,
        type: 'Talk',
        details: 'Warm welcome to new visitors and guests',
        productionNotes: 'SOUND: Upbeat Welcome Underscore Track + Host Mic | LIGHTS: House Lights UP 80% to spot guests | VIDEO: Display Welcome QR Code & Guest Lounge Slide',
        prompterText: 'If today is your very first time worshipping with us, you are our special guest of honour! Please wave your hand as our welcome team celebrates you.'
      },
      {
        title: 'Offering',
        speaker: 'Minister',
        durationMinutes: 8,
        type: 'Offering',
        details: 'Worship through tithes, offerings, and prophetic blessing',
        productionNotes: 'SOUND: Pulpit Mic + Rejoicing Offering Music | LIGHTS: Warm Amber Stage Wash | VIDEO: Display Giving Details / Bank & QR Lower-Third',
        prompterText: 'It is offering time—our covenant time of blessing! Lift your offering, tithe, or device above your head as we pray and give joyfully.'
      },
      {
        title: 'Choir Ministration',
        speaker: 'Choir / Soloist',
        durationMinutes: 7,
        type: 'Music',
        details: 'Special musical selection or choir anthem',
        productionNotes: 'SOUND: Choir Condensers + Solo Mic + Aux Tracks | LIGHTS: Spotlight on Soloist + Deep Blue Riser Backlight | VIDEO: Roving Gimbal + Cam 1 Cross-Dissolves',
        prompterText: 'Be blessed and ministered to as the Choir brings today\'s special song of ministration.'
      },
      {
        title: 'Word / Altar Call',
        speaker: 'Lead Pastor / Speaker',
        durationMinutes: 45,
        type: 'Sermon',
        details: 'Main message delivery and invitation for salvation/prayer',
        productionNotes: 'SOUND: Pastor Headset/Lapel Mic Primary + Handheld Backup Ready, Keys Pad cue at 5m left | LIGHTS: Broadcast Key Light 100%, House 15% | VIDEO: ISO Record Cam 2 + Sermon Notes Lower-Thirds',
        prompterText: 'Main Message Delivery. Watch the Stage Countdown Clock. At 5 minutes remaining, transition into the Word summary, Altar Call for salvation, and rededication prayer.'
      },
      {
        title: 'Prophetic Blessings & Closing',
        speaker: 'Lead Pastor',
        durationMinutes: 5,
        type: 'Prayer',
        details: 'Benediction, prophetic declarations, and final dismissal',
        productionNotes: 'SOUND: Pastor Mic + Swelling Outro Music on "Amen" | LIGHTS: Full Stage & House Up 100% | VIDEO: Outro Credits + Next Service Graphic',
        prompterText: 'Stretch forth your hands as we receive the prophetic blessing for the new week. Surely goodness and mercy shall follow us all the days of our lives. Amen!'
      }
    ]
  },
  {
    id: 'church-midweek',
    name: 'Midweek Service (Wednesday)',
    description: '11-part Midweek service rundown with intercessions, word, and communion',
    startTime: '18:30',
    slots: [
      {
        title: 'Opening Prayer',
        speaker: 'Leader',
        durationMinutes: 5,
        type: 'Prayer',
        details: 'Thanksgiving and dedication',
        productionNotes: 'SOUND: Wireless Mic 1 + Soft Keys Pad | LIGHTS: Evening Warm Wash | VIDEO: Title Slide + Cam 1 Center',
        prompterText: 'Let us lift up our voices and thank the Lord for gathering us again this Wednesday evening in His presence.'
      },
      {
        title: 'Praise & Worship',
        speaker: 'Worship Team',
        durationMinutes: 15,
        type: 'Worship',
        details: 'Midweek praise and congregational worship',
        productionNotes: 'SOUND: Worship Band Scene | LIGHTS: Midweek Worship Palette | VIDEO: Lyrics + Live Cam Mix',
        prompterText: 'Transition from joyful midweek praise into deep, focused worship.'
      },
      {
        title: 'Intercession 1–3',
        speaker: 'Prayer Leader',
        durationMinutes: 12,
        type: 'Prayer',
        details: 'Corporate intercessory petitions (rounds 1 to 3)',
        productionNotes: 'SOUND: Prayer Leader Mic + Instrumental Prayer Pad | LIGHTS: Deep Indigo/Amber Prayer Atmosphere | VIDEO: Project Prayer Bullet Points 1–3 & Scriptures on Screen',
        prompterText: 'Intercession 1 (4m): Read scripture & lead congregation in fervent prayer.\nIntercession 2 (4m): Read scripture & pray.\nIntercession 3 (4m): Read scripture & give thanks.'
      },
      {
        title: 'Announcements & Testimony',
        speaker: 'Host / MC',
        durationMinutes: 8,
        type: 'Talk',
        details: 'Weekly announcements and verified testimonies',
        productionNotes: 'SOUND: Host Mic | LIGHTS: Stage & House 50% | VIDEO: Sunday Service Promo Slide',
        prompterText: 'Share brief midweek announcements, upcoming Sunday service focus, and documented testimonies.'
      },
      {
        title: 'Intercession 4–6',
        speaker: 'Prayer Leader',
        durationMinutes: 12,
        type: 'Prayer',
        details: 'Corporate intercessory petitions (rounds 4 to 6)',
        productionNotes: 'SOUND: Prayer Leader Mic + Keys Pad | LIGHTS: Prayer Atmosphere | VIDEO: Project Prayer Bullet Points 4–6 & Scriptures on Screen',
        prompterText: 'Intercession 4 (4m): Lead petition with scripture.\nIntercession 5 (4m): Lead petition with scripture.\nIntercession 6 (4m): Seal prayers with thanksgiving.'
      },
      {
        title: 'Personal Supplication',
        speaker: 'Congregation',
        durationMinutes: 5,
        type: 'Prayer',
        details: 'Moments of personal prayer and supplication',
        productionNotes: 'SOUND: Gentle Instrumental Pad ONLY | LIGHTS: Dim House 20% | VIDEO: "Personal Supplication" Quiet Reflection Graphic',
        prompterText: 'Take these next 5 minutes to present your personal petitions and desires directly before the Lord in faith.'
      },
      {
        title: 'Offering',
        speaker: 'Minister',
        durationMinutes: 7,
        type: 'Offering',
        details: 'Midweek giving and prayer of thanksgiving',
        productionNotes: 'SOUND: Minister Mic + Upbeat Offering Track | LIGHTS: Warm Gold Wash | VIDEO: Giving Details Graphic',
        prompterText: 'Honour the Lord with your midweek offering and lift it up in thanksgiving.'
      },
      {
        title: 'High Praise',
        speaker: 'Worship Team',
        durationMinutes: 10,
        type: 'Worship',
        details: 'Celebration and high praise',
        productionNotes: 'SOUND: Full Band High-Energy Mix | LIGHTS: Vibrant Celebration Strobes/Movers | VIDEO: Multi-Cam + Lyrics',
        prompterText: 'Ten minutes of high-energy praise celebrating answered prayers!'
      },
      {
        title: 'Word / Altar Call',
        speaker: 'Pastor / Teacher',
        durationMinutes: 35,
        type: 'Sermon',
        details: 'Spiritual teaching and salvation call',
        productionNotes: 'SOUND: Pastor Mic Primary | LIGHTS: Clean Broadcast Key | VIDEO: Cam 2 Tight + Scripture Lower-Thirds',
        prompterText: 'Midweek Word & Teaching. Conclude with a brief altar call and transition to the Communion table.'
      },
      {
        title: 'Communion & Blessing',
        speaker: 'Pastor',
        durationMinutes: 10,
        type: 'Communion',
        details: 'Holy Communion and prophetic impartation',
        productionNotes: 'SOUND: Pastor Mic + Soft Worship Background | LIGHTS: Warm Crimson/Amber Table Spotlight | VIDEO: Close-up on Communion Table + Lyrics',
        prompterText: 'Blessing of the Bread (Body of Christ) and the Cup (Blood of the New Covenant). Ushers serve the congregation swiftly.'
      },
      {
        title: 'Closing Remarks',
        speaker: 'Host',
        durationMinutes: 5,
        type: 'Talk',
        details: 'Final instructions and dismissal',
        productionNotes: 'SOUND: Host Mic + Walk-Out Music | LIGHTS: Full House 100% | VIDEO: Closing Slide & Sunday Service Times',
        prompterText: 'Share closing benediction, remind everyone of Sunday service times, and wish everyone a blessed rest of the week!'
      }
    ]
  },
  {
    id: 'corporate-conference',
    name: 'Corporate Summit / Conference',
    description: 'Keynotes, fireside chats, panel discussions, break, and Q&A',
    startTime: '09:00',
    slots: [
      {
        title: 'Registration & Welcome Coffee',
        speaker: 'Organizers',
        durationMinutes: 30,
        type: 'Break',
        details: 'Badge pickup and morning networking',
        productionNotes: 'SOUND: Ambient Lounge Playlist (-12dB) | LIGHTS: House 80%, Stage Logo Wash | VIDEO: Sponsor Loop & Wi-Fi QR Code on Main LED Wall',
        prompterText: 'Welcome delegates! Please take your seats; the Opening Keynote begins shortly.'
      },
      {
        title: 'Opening Keynote Address',
        speaker: 'Keynote Speaker',
        durationMinutes: 45,
        type: 'Keynote',
        details: 'State of the industry and summit vision',
        productionNotes: 'SOUND: Countryman Headset Mic 1 + HDMI Slide Clicker Audio | LIGHTS: Crisp White Keynote Spot (5600K) | VIDEO: PIP Slide Deck + Speaker Cam 1',
        prompterText: 'Good morning everyone, and welcome to our Annual Summit. Today we explore the defining trends shaping our industry over the next decade.'
      },
      {
        title: 'Executive Panel Discussion',
        speaker: 'Panelists & Moderator',
        durationMinutes: 45,
        type: 'Panel',
        details: 'Interactive panel debate with audience Q&A',
        productionNotes: 'SOUND: Open Lav Mics 2–5 + 2x Audience Q&A Runner Mics | LIGHTS: Even Stage-Wide Wash | VIDEO: 3-Camera Split / Active Speaker Auto-Switch + Slido Q&A QR',
        prompterText: 'Moderator: Introduce all 4 panelists, lead 30 minutes of structured debate, and open the final 15 minutes to live audience Q&A.'
      },
      {
        title: 'Networking Break & Demos',
        speaker: 'Attendees',
        durationMinutes: 20,
        type: 'Break',
        details: 'Sponsor booth exhibition',
        productionNotes: 'SOUND: Mute All Stage Mics + Play Upbeat Break Playlist | LIGHTS: House 100% | VIDEO: Countdown Timer Bug on All Lobby & Hall Screens',
        prompterText: '20-minute networking break. Stage timer visible in foyer so delegates return on time.'
      },
      {
        title: 'Fireside Chat & Deep-Dive',
        speaker: 'Guest Leader',
        durationMinutes: 40,
        type: 'Talk',
        details: 'Unscripted executive conversation',
        productionNotes: 'SOUND: Lav Mics 1 & 2 | LIGHTS: Warm Intimate Stage Wash | VIDEO: Tight Two-Shot + Close-Up Reaction Cams',
        prompterText: 'Fireside conversation covering leadership lessons, scaling challenges, and rapid-fire takeaways.'
      },
      {
        title: 'Closing Remarks & Awards',
        speaker: 'Conference Chair',
        durationMinutes: 15,
        type: 'Talk',
        details: 'Wrap-up, summary, and evening reception details',
        productionNotes: 'SOUND: Podium Mic + Award Sting Cues | LIGHTS: Full Stage + Batten Uplights | VIDEO: Thank You Sponsors Slide & Reception Map',
        prompterText: 'Thank our keynote speakers, sponsors, and production crew, and invite all attendees to the networking reception.'
      }
    ]
  },
  {
    id: 'wedding-ceremony',
    name: 'Wedding Ceremony',
    description: 'Prelude, processional, vows, rings, signing, and recessional',
    startTime: '13:00',
    slots: [
      {
        title: 'Guest Arrival & Prelude',
        speaker: 'Pianist / Strings',
        durationMinutes: 30,
        type: 'Music',
        details: 'Seating background music',
        productionNotes: 'SOUND: Strings/Piano Stereo DI | LIGHTS: Soft Romantic Warm White | VIDEO: Couple Welcome Monogram on Side Screens',
        prompterText: 'Welcome family and friends. Please be seated as we prepare for the bridal procession.'
      },
      {
        title: 'Processional & Bridal Entry',
        speaker: 'Bridal Party',
        durationMinutes: 10,
        type: 'Ceremony',
        details: 'Processional entrance',
        productionNotes: 'SOUND: Cue Track 1 (Bridal Party) -> Fade to Track 2 (Bride Entry) | LIGHTS: Aisle Spotlights UP | VIDEO: Rear Aisle Cam + Groom Reaction PIP',
        prompterText: 'Please stand for the entrance of the Bride.'
      },
      {
        title: 'Welcome & Convocation',
        speaker: 'Officiant',
        durationMinutes: 5,
        type: 'Talk',
        details: 'Opening declaration of holy matrimony',
        productionNotes: 'SOUND: Officiant Lav Mic | LIGHTS: Altar Key Light | VIDEO: Center Shot (Cam 1)',
        prompterText: 'Dearly beloved, we are gathered here today in the sight of God and these witnesses to join this man and this woman in holy matrimony.'
      },
      {
        title: 'Exchange of Vows & Rings',
        speaker: 'Couple & Officiant',
        durationMinutes: 15,
        type: 'Ceremony',
        details: 'Sacred covenants and ring blessings',
        productionNotes: 'SOUND: Boost Groom & Bride Lavs (+3dB for quiet vows) | LIGHTS: Warm Altar Key | VIDEO: Tight Cross-Shots (Cam 2 & Cam 3)',
        prompterText: 'Officiant guides the declaration of consent, exchange of sacred vows, and blessing/giving of rings.'
      },
      {
        title: 'Signing of Marriage Register',
        speaker: 'Couple & Witnesses',
        durationMinutes: 10,
        type: 'Music',
        details: 'Legal register signing with musical accompaniment',
        productionNotes: 'SOUND: Mute Altar Lavs! Enable Soloist Mic + Accompaniment | LIGHTS: Spot on Register Table | VIDEO: Roaming Cam on Signing Table',
        prompterText: 'While the couple and witnesses sign the marriage register, enjoy this special musical selection.'
      },
      {
        title: 'Pronouncement & Presentation',
        speaker: 'Officiant',
        durationMinutes: 5,
        type: 'Ceremony',
        details: 'Pronouncement of marriage',
        productionNotes: 'SOUND: Officiant Mic | LIGHTS: Full Bright Altar | VIDEO: Wide Shot Ready for Kiss & Applause',
        prompterText: 'By the authority vested in me, I now pronounce you husband and wife! Ladies and gentlemen, I present to you the newlyweds!'
      },
      {
        title: 'Recessional',
        speaker: 'New Couple',
        durationMinutes: 5,
        type: 'Music',
        details: 'Recessional out to reception',
        productionNotes: 'SOUND: Cue Joyful Recessional Track at 0dB immediately on presentation | LIGHTS: Full House & Chandelier Glow | VIDEO: Follow Couple Down Aisle',
        prompterText: 'Celebrate the newlyweds as they recess down the aisle! Reception instructions to follow.'
      }
    ]
  },
  {
    id: 'product-book-launch',
    name: 'Product / Book Launch',
    description: 'Red carpet arrival, teaser video, keynote, unveiling, and signing',
    startTime: '18:00',
    slots: [
      {
        title: 'Arrival & Welcome Drinks',
        speaker: 'Host / MC',
        durationMinutes: 30,
        type: 'Break',
        details: 'Red carpet photography and mingling',
        productionNotes: 'SOUND: Upbeat Instrumental Lounge Mix | LIGHTS: Brand Accent Uplighting | VIDEO: Live Social Wall & Countdown Clock',
        prompterText: 'Welcome guests and press! Please take your seats for the official launch ceremony.'
      },
      {
        title: 'Welcome & Opening Remarks',
        speaker: 'Host',
        durationMinutes: 10,
        type: 'Talk',
        details: 'Context and introduction of the work',
        productionNotes: 'SOUND: Host Handheld Mic | LIGHTS: Stage Key Light | VIDEO: Lower-Third Host Name & Event Hashtag',
        prompterText: 'Good evening ladies and gentlemen! Thank you for joining us for this landmark unveiling.'
      },
      {
        title: 'Product / Book Teaser Video',
        speaker: 'AV Media Booth',
        durationMinutes: 5,
        type: 'Media',
        details: 'Official cinematic trailer presentation',
        productionNotes: 'SOUND: Cinema Video Stereo Feed Full | LIGHTS: Blackout Stage & House to 5% | VIDEO: Roll Master Launch Trailer (1080p60)',
        prompterText: '[VIDEO ROLLING — Stand by at stage right wing for Creator Keynote entrance]'
      },
      {
        title: 'Author / Founder Keynote',
        speaker: 'Author / Creator',
        durationMinutes: 25,
        type: 'Keynote',
        details: 'The journey, inspiration, and core message',
        productionNotes: 'SOUND: Creator Headset Mic + Clicker | LIGHTS: Spotlight Follow | VIDEO: Keynote Deck + Stage Cam',
        prompterText: 'Share the origin story, the problem we set out to solve, and the vision behind this launch.'
      },
      {
        title: 'Official Unveiling Ceremony',
        speaker: 'Dignitaries & Author',
        durationMinutes: 10,
        type: 'Ceremony',
        details: 'Unveiling the cover/product with photo-op',
        productionNotes: 'SOUND: Cue Fanfare Sting on Countdown "3-2-1" | LIGHTS: Reveal Strobe & Center Pedestal Spot | VIDEO: Hero Product Reveal Graphic on LED Wall',
        prompterText: 'Invite special guests to the center pedestal. Count down together: 3... 2... 1... UNVEIL! Hold for press photography.'
      },
      {
        title: 'Panel Discussion & Q&A',
        speaker: 'Author & Guest Reviewers',
        durationMinutes: 25,
        type: 'Panel',
        details: 'Audience questions and critique',
        productionNotes: 'SOUND: Panel Handhelds 1–3 + Audience Mic | LIGHTS: Warm Panel Wash | VIDEO: Multi-Cam Panel Layout',
        prompterText: 'Interactive conversation and live questions from media and guests.'
      },
      {
        title: 'Book Signing & Networking',
        speaker: 'Author & Attendees',
        durationMinutes: 30,
        type: 'Break',
        details: 'Exclusive book signing session',
        productionNotes: 'SOUND: Background Acoustic Playlist | LIGHTS: House 100% + Signing Table Spot | VIDEO: Order QR Code & Signing Queue Instructions',
        prompterText: 'Thank you for coming! The signing table and exhibition desk are now open at the front foyer.'
      }
    ]
  },
  {
    id: 'memorial-funeral',
    name: 'Memorial / Funeral Service',
    description: 'Prelude, tributes, scripture reading, sermon, and committal',
    startTime: '11:00',
    slots: [
      {
        title: 'Prelude & Seating',
        speaker: 'Organist / Choir',
        durationMinutes: 20,
        type: 'Music',
        details: 'Reflective hymns and seating of mourners',
        productionNotes: 'SOUND: Soft Organ / Strings | LIGHTS: Warm Respectful Amber & White | VIDEO: Photo Montage Slideshow Loop',
        prompterText: 'Please be seated quietly as the family processes in.'
      },
      {
        title: 'Opening Prayer & Hymn',
        speaker: 'Officiating Minister',
        durationMinutes: 8,
        type: 'Prayer',
        details: 'Opening invocation and congregational hymn',
        productionNotes: 'SOUND: Pulpit Mic + Choir | LIGHTS: Stage Key + House 50% | VIDEO: Hymn Lyrics on Screens',
        prompterText: 'The Lord gave, and the Lord hath taken away; blessed be the name of the Lord. Let us stand for our opening prayer and hymn.'
      },
      {
        title: 'Biography & Family Tributes',
        speaker: 'Family Representatives',
        durationMinutes: 20,
        type: 'Talk',
        details: 'Reading of life story and personal reflections',
        productionNotes: 'SOUND: Lectern Mic (Compress gently for emotional speakers) | LIGHTS: Soft Key Light | VIDEO: Portrait Slide + Speaker PIP',
        prompterText: 'Reading of the biography followed by tributes from the children and family representatives. Please keep individual tributes within 3–4 minutes.'
      },
      {
        title: 'Scripture Readings',
        speaker: 'Family Member',
        durationMinutes: 5,
        type: 'Talk',
        details: 'Comforting passages (Psalm 23 / 1 Cor 15)',
        productionNotes: 'SOUND: Lectern Mic | LIGHTS: Lectern Spot | VIDEO: Full Scripture Text Overlay',
        prompterText: 'Reading from Psalm 23 and 1 Corinthians 15:51–57.'
      },
      {
        title: 'Choir Selection / Solo',
        speaker: 'Choir',
        durationMinutes: 5,
        type: 'Music',
        details: 'Song of comfort and hope',
        productionNotes: 'SOUND: Soloist Mic + Piano | LIGHTS: Warm Stage Wash | VIDEO: Center Shot on Choir',
        prompterText: 'Musical tribute of comfort and eternal hope.'
      },
      {
        title: 'Funeral Sermon / Exhortation',
        speaker: 'Officiating Minister',
        durationMinutes: 20,
        type: 'Sermon',
        details: 'Message of eternal hope and resurrection',
        productionNotes: 'SOUND: Minister Mic | LIGHTS: Broadcast Key | VIDEO: Cam 1 Center + Scripture Lower-Thirds',
        prompterText: 'Exhortation on numbering our days, the comfort of the Holy Spirit, and the assurance of resurrection in Christ.'
      },
      {
        title: 'Benediction & Procession',
        speaker: 'Officiating Minister',
        durationMinutes: 7,
        type: 'Prayer',
        details: 'Final committal prayer and recessional',
        productionNotes: 'SOUND: Minister Mic -> Recessional Hymn | LIGHTS: Full House 100% | VIDEO: Pallbearers & Procession Instructions Slide',
        prompterText: 'Please stand in honour as the officiating clergy, pallbearers, and immediate family recess first.'
      }
    ]
  },
  {
    id: 'awards-gala',
    name: 'Awards & Gala Dinner',
    description: 'Cocktail arrival, dinner, live entertainment, award presentations, and closing',
    startTime: '19:00',
    slots: [
      {
        title: 'Red Carpet & Cocktail Reception',
        speaker: 'Guests & Press',
        durationMinutes: 45,
        type: 'Break',
        details: 'Cocktails and arrival photos',
        productionNotes: 'SOUND: Jazz/Soul Reception Mix | LIGHTS: Gold Gala Gobo Wash | VIDEO: Sponsor Logos & Table Seating Chart QR',
        prompterText: 'Welcome to the Annual Awards Gala! Chimes will sound in 5 minutes for guests to take their seats.'
      },
      {
        title: 'Opening Address & Welcome',
        speaker: 'Gala Host / MC',
        durationMinutes: 10,
        type: 'Talk',
        details: 'Welcome to the awards evening',
        productionNotes: 'SOUND: Voice-of-God Intro + Host Handheld | LIGHTS: Moving Heads Walk-On Cue | VIDEO: Gala Bumper Animation',
        prompterText: 'Good evening distinguished guests, nominees, and partners! Welcome to a night of excellence and celebration.'
      },
      {
        title: 'Dinner Service & Background Music',
        speaker: 'Live Band / Orchestra',
        durationMinutes: 50,
        type: 'Music',
        details: 'Dinner course served',
        productionNotes: 'SOUND: Live Acoustic Ensemble (-10dB conversational level) | LIGHTS: Warm Table Pin-Spots | VIDEO: Nominee Highlight Reel Loop',
        prompterText: 'Enjoy your dinner service. Award presentations will begin promptly at the conclusion of this timer.'
      },
      {
        title: 'Keynote & Special Feature',
        speaker: 'Guest of Honor',
        durationMinutes: 15,
        type: 'Keynote',
        details: 'Inspiring keynote address',
        productionNotes: 'SOUND: Podium Dual Gooseneck Mics | LIGHTS: Center Stage Spot | VIDEO: Tight Cam 2 + Keynote Lower-Third',
        prompterText: 'Keynote address celebrating industry milestones and impact.'
      },
      {
        title: 'Award Presentations (Categories 1–5)',
        speaker: 'Presenters & Winners',
        durationMinutes: 40,
        type: 'Ceremony',
        details: 'Trophy presentations and acceptance speeches',
        productionNotes: 'SOUND: Podium Mics + Nominee VT Roll + Walk-Up Winner Tracks | LIGHTS: Ballyhoo Sweep on Envelope Open | VIDEO: Nominee 4-Box Split -> Winner Graphic',
        prompterText: 'Presenters announce nominees, roll category VT, open envelope, and invite winners for a 90-second acceptance speech.'
      },
      {
        title: 'Headline Entertainment',
        speaker: 'Guest Artist / Performer',
        durationMinutes: 20,
        type: 'Music',
        details: 'Live musical showcase',
        productionNotes: 'SOUND: Artist Show File Scene | LIGHTS: Full Concert Show Mode | VIDEO: Multi-Cam Dynamic Cut',
        prompterText: 'Ladies and gentlemen, put your hands together for tonight\'s headline performance!'
      },
      {
        title: 'Vote of Thanks & After-Party',
        speaker: 'Gala Host',
        durationMinutes: 10,
        type: 'Talk',
        details: 'Closing remarks and dance floor open',
        productionNotes: 'SOUND: Host Mic -> DJ Handoff | LIGHTS: Dance Floor Wash | VIDEO: Congratulations Winners & Safe Journey Graphic',
        prompterText: 'Congratulations again to all our winners and finalists! Thank you for a magnificent evening—the after-party is now open!'
      }
    ]
  }
];

// Heuristic keyword matcher for SlotType presets
export function detectSlotType(title: string, speaker?: string): SlotType {
  const combined = `${title} ${speaker || ''}`.toLowerCase();
  
  if (/prayer|intercession|supplication|invocation|benediction|blessing/.test(combined)) {
    return 'Prayer';
  }
  if (/offering|tithe|giving|collection/.test(combined)) {
    return 'Offering';
  }
  if (/communion|lord's supper|breaking of bread/.test(combined)) {
    return 'Communion';
  }
  if (/praise|worship|hymn|singing|choir|song|chorus|instrumental|band|anthem/.test(combined)) {
    return 'Worship';
  }
  if (/word|sermon|message|preach|altar call|teaching|exhortation/.test(combined)) {
    return 'Sermon';
  }
  if (/video|trailer|teaser|cinematic|film|media/.test(combined)) {
    return 'Media';
  }
  if (/ceremony|vows|processional|recessional|unveiling|presentation/.test(combined)) {
    return 'Ceremony';
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
