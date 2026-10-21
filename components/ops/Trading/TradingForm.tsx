'use client';
import { useState, useId, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ops/ui/Input';
import Select from '@/components/ops/ui/Select';
import Textarea from '@/components/ops/ui/Textarea';
import Button from '@/components/ops/ui/Button';
import { TRADE_FREQUENCIES, PAYMENT_METHODS, type TradingLink, type BusinessOption } from '@/lib/ops/trading';

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok || !json.ok) throw new Error(json.error?.code ?? 'Could not save. Please retry.');
  return json.data as T;
}
export default function TradingForm({ businesses, initial, onSaved }: { businesses: BusinessOption[]; initial?: TradingLink; onSaved?: () => void }) {
  const router = useRouter();
  const formId = useId();
  const [added, setAdded] = useState<BusinessOption[]>([]);
  const options = [...new Map([...businesses, ...added].map(b => [b.id, b])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const [buyer, setBuyer] = useState(initial?.buyer_business_id ?? '');
  const [seller, setSeller] = useState(initial?.seller_business_id ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'reported');
  const [quickSide, setQuickSide] = useState<'buyer' | 'seller' | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function quickAdd() {
    setBusy(true); setError('');
    try {
      const business = await post<BusinessOption>('/api/ops/businesses/quick-add', { name });
      setAdded(prev => [...prev, business]);
      if (quickSide === 'buyer') setBuyer(business.id); else setSeller(business.id);
      setQuickSide(null); setName('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed. Please retry.'); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaved(false);
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      await post('/api/ops/trading-links/save', { ...fields, id: initial?.id, buyer_business_id: buyer, seller_business_id: seller, status, confirmed_by_both: fields.confirmed_by_both === 'on' });
      setSaved(true);
      if (!initial) { form.reset(); setBuyer(''); setSeller(''); setStatus('reported'); }
      router.refresh(); onSaved?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed. Your form is still here; please retry.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
      <div className="grid gap-5 sm:grid-cols-2">
        {(['buyer', 'seller'] as const).map(side => <div key={side} className="space-y-2">
          <Select className="min-h-12 text-base" id={`${formId}-${side}`} name={`${side}_business_id`} label={`${side === 'buyer' ? 'Buyer' : 'Seller'} business`} required value={side === 'buyer' ? buyer : seller} onChange={e => side === 'buyer' ? setBuyer(e.target.value) : setSeller(e.target.value)} placeholder="Choose a business" options={options.map(b => ({ value: b.id, label: b.name, disabled: b.id === (side === 'buyer' ? seller : buyer) }))} />
          <Button className="min-h-11" onClick={() => { setQuickSide(side); setName(''); }}>+ Quick-add {side}</Button>
        </div>)}
      </div>
      {quickSide && <div className="space-y-3 border border-line-15 p-4">
        <Input className="min-h-12 text-base" label={`New ${quickSide} business name`} id={`${formId}-quick_name`} name="quick_name" value={name} maxLength={200} onChange={e => setName(e.target.value)} />
        <p className="text-sm text-fg-mute">Check the list first to avoid duplicates. You can add the location later.</p>
        <div className="flex gap-3"><Button onClick={quickAdd} disabled={!name.trim()} variant="primary">Add business</Button><Button onClick={() => setQuickSide(null)}>Cancel</Button></div>
      </div>}
      <Input className="min-h-12 text-base" label="Goods or service" id={`${formId}-goods_or_service`} name="goods_or_service" maxLength={500} required defaultValue={initial?.goods_or_service ?? ''} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select className="min-h-12 text-base" label="Trade frequency" id={`${formId}-trade_frequency`} name="trade_frequency" required defaultValue={initial?.trade_frequency ?? ''} placeholder="Choose frequency" options={TRADE_FREQUENCIES.map(value => ({ value, label: value }))} />
        <Select className="min-h-12 text-base" label="Current payment method" id={`${formId}-current_payment_method`} name="current_payment_method" required defaultValue={initial?.current_payment_method ?? ''} placeholder="Choose method" options={PAYMENT_METHODS.map(value => ({ value, label: value }))} />
      </div>
      <Textarea className="text-base" label="Payment pain note (optional)" id={`${formId}-payment_pain_note`} name="payment_pain_note" maxLength={2000} defaultValue={initial?.payment_pain_note ?? ''} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input className="min-h-12 text-base" label="Buyer contact name (optional)" id={`${formId}-buyer_contact_name`} name="buyer_contact_name" maxLength={160} defaultValue={initial?.buyer_contact_name ?? ''} />
        <Input className="min-h-12 text-base" label="Buyer WhatsApp (optional)" id={`${formId}-buyer_whatsapp`} name="buyer_whatsapp" type="tel" inputMode="tel" maxLength={40} defaultValue={initial?.buyer_whatsapp ?? ''} />
        <Input className="min-h-12 text-base" label="Seller contact name (optional)" id={`${formId}-seller_contact_name`} name="seller_contact_name" maxLength={160} defaultValue={initial?.seller_contact_name ?? ''} />
        <Input className="min-h-12 text-base" label="Seller WhatsApp (optional)" id={`${formId}-seller_whatsapp`} name="seller_whatsapp" type="tel" inputMode="tel" maxLength={40} defaultValue={initial?.seller_whatsapp ?? ''} />
      </div>
      <Select className="min-h-12 text-base" label="Status" id={`${formId}-status`} name="status" value={status} onChange={e => setStatus(e.target.value as 'reported' | 'confirmed')} options={[{ value: 'reported', label: 'Reported' }, { value: 'confirmed', label: 'Confirmed by both sides' }]} />
      {status === 'confirmed' && <label className="flex min-h-12 items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" id={`${formId}-confirmed_by_both`} name="confirmed_by_both" required />I have checked this trading relationship with both businesses.</label>}
      <Button className="min-h-12" type="submit" variant="primary" fullWidth disabled={quickSide !== null}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Log trading link'}</Button>
    </fieldset>
    {error && <p role="alert" className="text-status-bad">{error}</p>}
    {saved && <p role="status" className="text-status-ok">Trading link saved.</p>}
  </form>;
}
