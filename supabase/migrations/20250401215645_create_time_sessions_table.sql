create table public.time_sessions (
    id uuid not null default gen_random_uuid(),
    task_id uuid not null,
    user_id uuid not null,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone null,
    duration interval null,
    created_at timestamp with time zone not null default now(),
    constraint time_sessions_pkey primary key (id),
    constraint time_sessions_task_id_fkey foreign key (task_id) references tasks (id) on update cascade on delete cascade,
    constraint time_sessions_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete set null
);

alter table public.time_sessions enable row level security;

create policy "Allow users to view their own time sessions" on public.time_sessions
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own time sessions" on public.time_sessions
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own time sessions" on public.time_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optionally, add an index for faster querying by task_id
create index if not exists idx_time_sessions_task_id on public.time_sessions(task_id);
-- Optionally, add an index for faster querying by user_id
create index if not exists idx_time_sessions_user_id on public.time_sessions(user_id);