begin;

with target_user as (
  select id, email
  from auth.users
  where email = 'iriasnandinho@gmail.com'
),
sync_public_user as (
  insert into public.users (id, email)
  select id, email
  from target_user
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now()
  returning id
),
updated_subscription as (
  update public.subscriptions s
  set provider = 'manual',
      plan = 'pro',
      status = 'active',
      current_period_end = now() + interval '1 year',
      updated_at = now()
  where s.user_id in (select id from target_user)
  returning s.user_id
)
insert into public.subscriptions (
  user_id,
  provider,
  plan,
  status,
  current_period_end,
  created_at,
  updated_at
)
select
  tu.id,
  'manual',
  'pro',
  'active',
  now() + interval '1 year',
  now(),
  now()
from target_user tu
where not exists (
  select 1
  from updated_subscription us
  where us.user_id = tu.id
);

update public.usage_limits ul
set limit_count = 50,
    updated_at = now()
where ul.user_id in (
  select id
  from auth.users
  where email = 'iriasnandinho@gmail.com'
)
and ul.usage_date = current_date;

select
  u.email,
  s.plan,
  s.status,
  s.current_period_end,
  ul.used_count,
  ul.limit_count,
  ul.usage_date
from auth.users u
left join public.subscriptions s on s.user_id = u.id
left join public.usage_limits ul on ul.user_id = u.id and ul.usage_date = current_date
where u.email = 'iriasnandinho@gmail.com'
order by s.updated_at desc nulls last
limit 1;

commit;