import type { SectorKey } from "@/lib/ops/sector-colors";

export type MapBusiness = {
  id: string;
  name: string;
  sector: SectorKey;
  zone_id: string | null;
  lat: number;
  lng: number;
  est_monthly_volume: number | null;
  launch_6: boolean;
  notes: string | null;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  key_suppliers: string[] | null;
  key_customers: string[] | null;
  pain_points: string[] | null;
  zimx_fit_score: number | null;
  active: boolean;
};

export type MapLinkEndpoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type MapLink = {
  id: string;
  product: string | null;
  est_monthly_volume: number | null;
  payment_frequency: string | null;
  supplier: MapLinkEndpoint | null;
  buyer: MapLinkEndpoint | null;
};

export type MapZone = {
  id: string;
  name: string;
  centre_lat: number | null;
  centre_lng: number | null;
};

export type MapIntroduction = {
  id: string;
  contact_name: string;
  role: string | null;
  business: string | null;
  business_id: string | null;
  warmth: string;
  introduced_by_name: string;
};
