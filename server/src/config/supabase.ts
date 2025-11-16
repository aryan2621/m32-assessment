import { createClient } from '@supabase/supabase-js';
import { config } from './constants';

export const supabase = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!);
