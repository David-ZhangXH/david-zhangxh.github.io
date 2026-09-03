# The message board — making it shared

By default (`content/board.json` → `"provider": "local"`) every visitor's pinned
words live only in their own browser. To let everyone read everyone's messages,
point the board at a free Supabase project (about five minutes):

1. Create a project at supabase.com (free tier is enough). Open **SQL Editor** and run:

```sql
create table public.messages (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 1 and 280),
  at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "anyone can read"  on public.messages for select using (true);
create policy "anyone can write" on public.messages for insert with check (char_length(text) between 1 and 280);
```

2. In **Project Settings → API**, copy the *Project URL* and the *anon public* key.

3. Edit `content/board.json`:

```json
{ "provider": "supabase", "url": "https://YOUR-PROJECT.supabase.co", "anonKey": "YOUR-ANON-KEY", "table": "messages" }
```

4. Commit + push. The site reads with `select`, writes with `insert`; nothing can edit or delete
   through the anon key because no such policy exists. To remove a message, delete the row in the
   Supabase table editor.

The anon key is meant to be public (it is shipped to every browser); the row-level policies above are
what keep the table safe.
