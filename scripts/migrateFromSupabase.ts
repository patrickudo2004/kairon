/**
 * Supabase → Convex Migration Script
 * 
 * HOW TO RUN (from the kairon-main folder in your terminal):
 *   npx tsx scripts/migrateFromSupabase.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

const CONVEX_URL = "https://majestic-gecko-369.convex.cloud";

const CSV = {
    organizations: path.join(process.cwd(), "organizations_rows.csv"),
    programs: path.join(process.cwd(), "programs_rows.csv"),
    slots: path.join(process.cwd(), "slots_rows.csv"),
};

const client = new ConvexHttpClient(CONVEX_URL);

// ─── CSV PARSER ─────────────────────────────────────────────────────────────
function parseCSV(filePath: string): Record<string, string>[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current); current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function migrate() {
    console.log("🚀 Starting Supabase → Convex migration...\n");

    // ── STEP 1: Migrate Organization ─────────────────────────────────────
    console.log("📁 Migrating organizations...");
    const orgs = parseCSV(CSV.organizations);
    const orgIdMap = new Map<string, string>();

    for (const org of orgs) {
        try {
            const convexId = await client.mutation(api.orgs.createOrganization, {
                name: org.name,
                slug: org.slug || org.name.toLowerCase().replace(/\s+/g, "-"),
                userId: org.created_by || "migrated",
            });
            const id = (convexId as any)._id ?? convexId;
            orgIdMap.set(org.id, id);
            console.log(`  ✅ "${org.name}" → ${id}`);
        } catch (err: any) {
            console.error(`  ❌ "${org.name}": ${err.message}`);
        }
    }
    console.log(`  Done: ${orgIdMap.size} organization(s)\n`);

    // ── STEP 2: Migrate Programs + Slots ──────────────────────────────────
    console.log("📋 Migrating programs...");
    const allPrograms = parseCSV(CSV.programs);
    const allSlots = parseCSV(CSV.slots);
    const programIdMap = new Map<string, string>();

    for (const program of allPrograms) {
        const convexOrgId = orgIdMap.get(program.organization_id);
        if (!convexOrgId) {
            console.warn(`  ⚠️  Skipping "${program.title}" — org not found`);
            continue;
        }

        // Collect and sort slots for this program
        const programSlots = allSlots
            .filter(s => s.program_id === program.id)
            .sort((a, b) => parseInt(a.order || "0") - parseInt(b.order || "0"))
            .map(s => ({
                id: s.id,
                title: s.title || "Untitled",
                speaker: s.speaker || "",
                durationMinutes: parseInt(s.duration_minutes) || 5,
                type: s.type || "TALK",
                details: s.details || undefined,
                actualDuration: s.actual_duration ? parseInt(s.actual_duration) : undefined,
            }));

        try {
            const convexId = await client.mutation(api.programs.migrateProgram, {
                title: program.title || "Untitled",
                subtitle: program.subtitle || "",
                date: program.date || new Date().toISOString().split("T")[0],
                startTime: program.start_time || "09:00",
                endTime: program.end_time || undefined,
                organizationId: convexOrgId as any,
                slots: programSlots,
                estimatedAttendees: program.estimated_attendees ? parseInt(program.estimated_attendees) : undefined,
                averageHourlyRate: program.average_hourly_rate ? parseFloat(program.average_hourly_rate) : undefined,
                isManualMode: program.manual_mode === "true",
                isOnHold: program.is_on_hold === "true",
                slug: program.slug || undefined,
                isPublic: program.is_public === "true",
                status: (program.status as "draft" | "live" | "concluded") || "draft",
                currentSlotIndex: program.current_slot_index ? parseInt(program.current_slot_index) : 0,
                isTimerActive: program.is_timer_active === "true",
                secondsElapsed: program.seconds_elapsed ? parseInt(program.seconds_elapsed) : 0,
            });
            const id = (convexId as any)._id ?? convexId;
            programIdMap.set(program.id, id);
            console.log(`  ✅ "${program.title}" (${programSlots.length} slots)`);
        } catch (err: any) {
            console.error(`  ❌ "${program.title}": ${err.message}`);
        }
    }
    console.log(`  Done: ${programIdMap.size} programs\n`);

    // ── STEP 3: Summary ───────────────────────────────────────────────────
    const totalSlots = allSlots.filter(s => programIdMap.has(s.program_id)).length;
    console.log("─────────────────────────────────────────────");
    console.log("✅ Migration complete!");
    console.log(`   Organizations: ${orgIdMap.size}`);
    console.log(`   Programs:      ${programIdMap.size}`);
    console.log(`   Slots:         ${totalSlots}`);
    console.log("─────────────────────────────────────────────");
    console.log("\n🎉 Check your data at:");
    console.log("   https://dashboard.convex.dev → kairon → Data tab");
}

migrate().catch(err => {
    console.error("\n❌ Migration failed:\n", err);
    process.exit(1);
});
