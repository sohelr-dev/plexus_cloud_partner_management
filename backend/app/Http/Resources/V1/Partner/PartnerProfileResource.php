<?php

namespace App\Http\Resources\V1\Partner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * PartnerProfileResource — commercial/contract details (1:1 with Partner).
 * Fields strictly match the partner_profiles table (2026_09_24_000002).
 */
class PartnerProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'business_type' => $this->business_type,
            'business_category' => $this->business_category,
            'operating_area' => $this->operating_area,
            'contract_type' => $this->contract_type,
            'contract_start_date' => $this->contract_start_date?->toDateString(),
            'contract_end_date' => $this->contract_end_date?->toDateString(),
            'payment_terms' => $this->payment_terms,
            'credit_limit' => (float) $this->credit_limit,
            'credit_days' => (int) $this->credit_days,
            'security_deposit' => (float) $this->security_deposit,
            'billing_cycle' => $this->billing_cycle,
            'pricing_model' => $this->pricing_model,
            'discount_policy' => $this->discount_policy,
            'commission_model' => $this->commission_model,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
