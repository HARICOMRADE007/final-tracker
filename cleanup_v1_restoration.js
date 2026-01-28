
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

console.log('Reading .env from:', envPath);

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    const url = envVars['VITE_SUPABASE_URL'];
    const key = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['VITE_SUPABASE_ANON_KEY'];

    if (!url || !key) {
        console.error('Missing Supabase URL or Key in .env');
        process.exit(1);
    }

    const supabase = createClient(url, key);

    async function cleanup() {
        console.log('Cleaning up "Others" category transactions...');
        const { error, count, data } = await supabase
            .from('expenses')
            .delete({ count: 'exact' })
            .eq('category', 'Others'); // CAREFUL: This deletes ALL 'Others'

        if (error) {
            console.error('Error cleaning up:', error);
        } else {
            console.log(`Success! Deleted transactions.`);
            console.log('Response:', { data, count });
        }
    }

    cleanup();

} catch (err) {
    console.error('Failed to read .env or execute script:', err);
}
