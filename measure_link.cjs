
const zlib = require('zlib');

// --- Mock Data ---
const Program = {
    id: '1',
    title: 'FutureTech Conference 2025',
    subtitle: 'Innovating for Tomorrow',
    date: '2025-12-08',
    startTime: '09:00',
    endTime: '09:30',
    slots: [
        {
            id: '1',
            title: 'Opening Remarks',
            speaker: 'Alice Johnson',
            durationMinutes: 1,
            type: 'KEYNOTE',
            details: "Welcome address covering the conference theme 'Innovating for Tomorrow'. We will review the day's schedule, logistics, safety protocols, and introduce our key sponsors."
        },
        {
            id: '2',
            title: 'AI in Healthcare',
            speaker: 'Dr. Bob Smith',
            durationMinutes: 1,
            type: 'TALK',
            details: "A deep dive into how large language models are transforming diagnostic processes. Includes case studies from recent deployments in major urban hospitals and a look at the ethical considerations of AI in patient care."
        },
        {
            id: '3',
            title: 'Coffee Break',
            speaker: '',
            durationMinutes: 1,
            type: 'BREAK',
            details: "Networking opportunity in the main foyer. Refreshments and light snacks provided by our gold sponsor, TechCorp. Please take this time to visit the exhibitor booths."
        },
        {
            id: '4',
            title: 'Quantum Computing Panel',
            speaker: 'Panelists',
            durationMinutes: 1,
            type: 'PANEL',
            details: "Expert panel discussion on the current state of quantum supremacy. Featuring guests from leading research labs and universities. Topics include error correction, qubit scalability, and post-quantum cryptography."
        },
    ]
};

const MINIFY_VERSION = 1;

const minifyProgram = (p) => {
    return [
        MINIFY_VERSION,
        p.id,
        p.title,
        p.subtitle,
        p.date,
        p.startTime,
        p.endTime || null,
        p.slots.map(s => [
            s.id,
            s.title,
            s.speaker,
            s.durationMinutes,
            s.type,
            s.details || "",
            s.actualDuration || 0
        ])
    ];
};

const encodeCurrent = (data) => {
    const minified = minifyProgram(data);
    const jsonStr = JSON.stringify(minified);
    return Buffer.from(encodeURIComponent(jsonStr)).toString('base64');
};

const encodeCompressed = (data) => {
    const minified = minifyProgram(data);
    const jsonStr = JSON.stringify(minified);
    const buffer = zlib.deflateSync(jsonStr);
    return buffer.toString('base64');
};

const currentStr = encodeCurrent(Program);
const compressedStr = encodeCompressed(Program);

const viewerLinkCurrent = `#/live?mode=viewer&import=${currentStr}`;
const editorLinkCurrent = `#/?mode=editor&import=${currentStr}`;

const viewerLinkCompressed = `#/live?mode=viewer&import=${compressedStr}`;

console.log("--- Link Length Analysis ---");
console.log("Original JSON Length:", JSON.stringify(Program).length);
console.log("Minified JSON Length:", JSON.stringify(minifyProgram(Program)).length);
console.log("\n[CURRENT STRATEGY]");
console.log("Encoded Data Payload:", currentStr.length, "chars");
console.log("Full Viewer Link:", viewerLinkCurrent.length, "chars");
console.log("Full Editor Link:", editorLinkCurrent.length, "chars");

console.log("\n[COMPRESSION STRATEGY (Deflate/Gzip)]");
console.log("Encoded Data Payload:", compressedStr.length, "chars");
console.log("Full Viewer Link (Est):", viewerLinkCompressed.length, "chars");
console.log("Reduction:", Math.round((1 - (compressedStr.length / currentStr.length)) * 100) + "%");

// Without Details
const ProgramNoDetails = JSON.parse(JSON.stringify(Program));
ProgramNoDetails.slots.forEach(s => s.details = "");
const currentStrNoDetails = encodeCurrent(ProgramNoDetails);

console.log("\n[NO DETAILS STRATEGY]");
console.log("Encoded Data Payload:", currentStrNoDetails.length, "chars");
console.log("Reduction vs Current:", Math.round((1 - (currentStrNoDetails.length / currentStr.length)) * 100) + "%");
