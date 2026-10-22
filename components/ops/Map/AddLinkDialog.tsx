'use client';
import Dialog from '@/components/ops/ui/Dialog';
import Button from '@/components/ops/ui/Button';
import type { MapBusiness } from './types';

export default function AddLinkDialog({ open, onClose }: { open: boolean; onClose: () => void; businesses: MapBusiness[] }) {
  return <Dialog open={open} onClose={onClose} ariaLabel="Trading Links"><Dialog.Header><Dialog.Title>Trading Links</Dialog.Title><Dialog.CloseButton onClose={onClose} /></Dialog.Header><Dialog.Body><p className="mb-4">Log buyer and seller details, payment challenges and confirmation status.</p><Button href="/indaba/trading-links" variant="primary">Open Trading Links</Button></Dialog.Body></Dialog>;
}
