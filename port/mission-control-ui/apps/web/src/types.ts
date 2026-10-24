export type Variant = 'default' | 'decision' | 'risk' | 'opportunity' | 'relationship';
export interface Rec {
  id: string; entity: string; title: string; context?: string; recommendation?: string;
  outcome?: string; why?: string; impact: number; confidence: number; actions: string[];
}
