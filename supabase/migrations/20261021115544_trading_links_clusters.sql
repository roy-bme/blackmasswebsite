begin;

-- Inspected production 2026-10-21: legacy supplier_id/buyer_id/product/mapped_by,
-- created_at already present; zero links. Retain all legacy columns and data.
alter table public.supply_chain_links
  add column buyer_business_id uuid references public.businesses(id),
  add column seller_business_id uuid references public.businesses(id),
  add column goods_or_service text,
  add column trade_frequency text check (trade_frequency in ('weekly','fortnightly','monthly','ad hoc')),
  add column current_payment_method text check (current_payment_method in ('cash','EcoCash','bank transfer','credit','other')),
  add column payment_pain_note text,
  add column buyer_contact_name text,
  add column buyer_whatsapp text,
  add column seller_contact_name text,
  add column seller_whatsapp text,
  add column status text not null default 'reported' check (status in ('reported','confirmed')),
  add column created_by uuid references public.users(id);

update public.supply_chain_links set
  buyer_business_id = buyer_id, seller_business_id = supplier_id,
  goods_or_service = product, created_by = mapped_by,
  trade_frequency = case lower(payment_frequency)
    when 'weekly' then 'weekly' when 'fortnightly' then 'fortnightly'
    when 'monthly' then 'monthly' when 'ad-hoc' then 'ad hoc' when 'ad hoc' then 'ad hoc' end,
  current_payment_method = case lower(payment_method)
    when 'cash' then 'cash' when 'ecocash' then 'EcoCash' when 'bank' then 'bank transfer'
    when 'bank transfer' then 'bank transfer' when 'credit' then 'credit'
    else case when payment_method is null then null else 'other' end end,
  payment_pain_note = array_to_string(friction_points, '; ');
-- Unknown legacy ownership stays NULL and is visible only to Roy/admin.
-- Missing historic timestamps stay NULL rather than being counted as newly logged.
alter table public.supply_chain_links alter column created_by set default auth.uid();
alter table public.supply_chain_links alter column created_at set default now();

-- Unknown locations are NULL, never invented coordinates. Existing values untouched.
alter table public.businesses alter column lat drop not null;
alter table public.businesses alter column lng drop not null;

-- Production lacks the existing repo's role-lockdown trigger. Without this,
-- users_update_self_or_admin would let a field user grant themselves admin.
create or replace function public.guard_users_role_lockdown()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and
     (new.id is distinct from old.id or new.role is distinct from old.role
      or new.active is distinct from old.active or new.revoked_at is distinct from old.revoked_at) then
    raise exception 'Account access fields are server-managed' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists users_guard_role_lockdown on public.users;
create trigger users_guard_role_lockdown before update on public.users
for each row execute function public.guard_users_role_lockdown();
revoke all on function public.guard_users_role_lockdown() from public;

-- Keep old graph/map/agent readers compatible. Legacy-only inserts remain
-- reported; they cannot silently become confirmed graph evidence.
create function public.sync_trading_link_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.buyer_business_id := coalesce(new.buyer_business_id, new.buyer_id);
    new.seller_business_id := coalesce(new.seller_business_id, new.supplier_id);
    new.goods_or_service := coalesce(new.goods_or_service, new.product);
    new.created_by := coalesce(new.created_by, new.mapped_by);
  else
    if new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
      raise exception 'Link attribution and creation date cannot be changed' using errcode = '42501';
    end if;
    if new.buyer_id is distinct from old.buyer_id and new.buyer_business_id is not distinct from old.buyer_business_id then new.buyer_business_id := new.buyer_id; end if;
    if new.supplier_id is distinct from old.supplier_id and new.seller_business_id is not distinct from old.seller_business_id then new.seller_business_id := new.supplier_id; end if;
    if new.product is distinct from old.product and new.goods_or_service is not distinct from old.goods_or_service then new.goods_or_service := new.product; end if;
  end if;
  if new.buyer_business_id = new.seller_business_id then
    raise exception 'Buyer and seller must differ' using errcode = '23514';
  end if;
  if current_user = 'authenticated' then
    if new.buyer_business_id is null or new.seller_business_id is null
       or nullif(btrim(new.goods_or_service), '') is null
       or new.trade_frequency is null or new.current_payment_method is null then
      raise exception 'Business endpoints, goods, frequency and payment method are required' using errcode = '23514';
    end if;
    if tg_op = 'INSERT' then new.created_at := now(); end if;
  end if;
  new.buyer_id := new.buyer_business_id;
  new.supplier_id := new.seller_business_id;
  new.product := new.goods_or_service;
  new.mapped_by := new.created_by;
  if new.current_payment_method is not null then new.payment_method := new.current_payment_method; end if;
  if new.trade_frequency is not null then new.payment_frequency := new.trade_frequency; end if;
  return new;
end;
$$;
create trigger sync_trading_link_fields before insert or update on public.supply_chain_links
for each row execute function public.sync_trading_link_fields();
revoke all on function public.sync_trading_link_fields() from public;

alter table public.supply_chain_links enable row level security;
revoke all on public.supply_chain_links from anon, authenticated;
grant select, insert, update on public.supply_chain_links to authenticated;
drop policy if exists sc_links_select_compliance on public.supply_chain_links;
drop policy if exists sc_links_select_ops_admin on public.supply_chain_links;
drop policy if exists sc_links_write_ops_admin on public.supply_chain_links;
-- Restrictive guard prevents another permissive policy from widening visibility.
create policy trading_links_scope on public.supply_chain_links as restrictive
for all to authenticated
using (exists (select 1 from public.users u where u.id = (select auth.uid())
  and u.active and u.revoked_at is null and u.role in ('admin','ops','bd')
  and (u.role = 'admin' or created_by = u.id)))
with check (exists (select 1 from public.users u where u.id = (select auth.uid())
  and u.active and u.revoked_at is null and u.role in ('admin','ops','bd')
  and (u.role = 'admin' or created_by = u.id)));
create policy trading_links_read on public.supply_chain_links for select to authenticated using (true);
create policy trading_links_insert on public.supply_chain_links for insert to authenticated
with check (created_by = (select auth.uid()));
create policy trading_links_update on public.supply_chain_links for update to authenticated
using (true) with check (true);

-- Existing directory remains shared for choosing businesses, but quick-add
-- cannot forge attribution or be used by inactive accounts.
alter table public.businesses enable row level security;
create policy business_insert_owner on public.businesses as restrictive for insert to authenticated
with check (mapped_by = (select auth.uid()) and exists (
  select 1 from public.users u where u.id = (select auth.uid())
  and u.active and u.revoked_at is null and u.role in ('admin','ops','bd')));
grant select, insert on public.businesses to authenticated;

-- The existing KPI view otherwise exposes the global link count outside RLS.
do $$ begin
  if to_regclass('public.v_indaba_kpis') is not null then
    alter view public.v_indaba_kpis set (security_invoker = true);
  end if;
end $$;

create index supply_chain_links_created_by_time on public.supply_chain_links(created_by, created_at);
create index supply_chain_links_confirmed_endpoints on public.supply_chain_links(buyer_business_id, seller_business_id) where status = 'confirmed';
create index supply_chain_links_seller on public.supply_chain_links(seller_business_id);
commit;
