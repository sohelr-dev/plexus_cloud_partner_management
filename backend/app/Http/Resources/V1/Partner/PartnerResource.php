<?php

namespace App\Http\Resources\V1\Partner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * PartnerResource — API representation of a partner.
 * Fields strictly match the partners table (2026_09_24_000002).
 */
class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,          // PT-000125
            'partner_code' => $this->partner_code,      // ABC-00125
            'partner_name' => $this->partner_name,
            'legal_name' => $this->legal_name,
            'business_name' => $this->business_name,
            'partner_type' => $this->partner_type,
            'partner_category' => $this->partner_category,
            'contact_person' => $this->contact_person,
            'contact_number' => $this->contact_number,
            'email' => $this->email,
            'address' => $this->address,
            'territory_id' => $this->territory_id,
            'zone_id' => $this->zone_id,
            'area_id' => $this->area_id,
            'account_manager_id' => $this->account_manager_id,
            'relationship_manager_id' => $this->relationship_manager_id,
            'partner_since' => $this->partner_since?->toDateString(),
            'status' => $this->status,
            'health_score' => (float) $this->health_score,
            'health_status' => $this->health_status,
            'logo_path' => $this->logo_path,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Loaded relations only (avoid N+1 surprises)
            'profile' => new PartnerProfileResource($this->whenLoaded('profile')),
            'territory' => $this->whenLoaded('territory'),
            'zone' => $this->whenLoaded('zone'),
            'area' => $this->whenLoaded('area'),
            'account_manager' => $this->whenLoaded('accountManager'),
            'relationship_manager' => $this->whenLoaded('relationshipManager'),
            'risk_indicators' => $this->whenLoaded('riskIndicators'),
            'insights' => $this->whenLoaded('insights'),
        ];
    }
}
