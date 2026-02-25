import { createClient } from '@supabase/supabase-js';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const convexUrl = process.env.VITE_CONVEX_URL;

if (!supabaseUrl || !supabaseKey || !convexUrl) {
    console.error("Missing environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_CONVEX_URL");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const convex = new ConvexHttpClient(convexUrl);

async function migrate() {
    console.log("🚀 Starting Migration to Convex...");

    // 1. Migrate Profiles
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    if (!profError && profiles) {
        console.log(`👤 Migrating ${profiles.length} profiles...`);
        for (const prof of profiles) {
            await convex.mutation(api.profiles.upsertProfile, {
                userId: prof.id,
                fullName: prof.full_name,
                avatarUrl: prof.avatar_url
            });
        }
    }

    // 2. Migrate Orgs & Their Programs
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
    if (orgError) {
        console.error("Error fetching organizations:", orgError);
        return;
    }

    console.log(`📦 Found ${orgs.length} organizations.`);

    for (const org of orgs) {
        console.log(`Migrating Org: ${org.name}...`);
        // Note: createOrganization also creates a member entry
        const orgId = await convex.mutation(api.orgs.createOrganization, {
            name: org.name,
            slug: org.slug,
            userId: org.created_by
        });

        const { data: programs, error: progError } = await supabase
            .from('programs')
            .select('*')
            .eq('organization_id', org.id);

        if (!progError && programs) {
            for (const prog of programs) {
                await convex.mutation(api.programs.createProgram, {
                    title: prog.title,
                    subtitle: prog.subtitle,
                    date: prog.date,
                    startTime: prog.start_time,
                    organizationId: orgId,
                    slots: prog.slots
                });
                console.log(`   📄 Migrated Program: ${prog.title}`);
            }
        }
    }

    console.log("🏁 Migration Complete!");
}

migrate().catch(console.error);
