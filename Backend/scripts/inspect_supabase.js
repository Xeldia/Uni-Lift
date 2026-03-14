import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const rootEnvPath = path.join(process.cwd(), "Backend", ".env");
const localEnvPath = path.join(process.cwd(), ".env");
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: localEnvPath, override: false });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env (checked Backend/.env and current folder .env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const tables = ['users','rides','verifications','sos_alerts','messages'];

async function getColumns(table) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name,data_type,ordinal_position')
      .eq('table_schema', 'public')
      .eq('table_name', table)
      .order('ordinal_position', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}

async function inspect() {
  for (const table of tables) {
    console.log('\n=== TABLE:', table, '===');
    const cols = await getColumns(table);
    if (cols && cols.length) {
      console.log('Columns:');
      for (const c of cols) console.log('-', c.column_name, c.data_type);
    } else {
      console.log('Could not fetch information_schema for', table, '- will infer from rows');
    }

    try {
      const { data, error } = await supabase.from(table).select('*').limit(50);
      if (error) {
        console.log('Error fetching rows for', table, error.message || error);
        continue;
      }

      if (!data || data.length === 0) {
        console.log('No rows found.');
        continue;
      }

      if (!cols || cols.length === 0) {
        // infer columns
        const inferred = Object.keys(data[0]);
        console.log('Inferred columns:', inferred.join(', '));
      }

      console.log('Sample rows (up to 50):');
      console.dir(data, { depth: 2 });
    } catch (err) {
      console.log('Unexpected error querying', table, err);
    }
  }
}

inspect().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(2); });
