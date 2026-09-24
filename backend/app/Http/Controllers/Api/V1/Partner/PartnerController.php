<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\Partner\PartnerResource;
use App\Models\Partner\Partner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class PartnerController extends Controller
{
    public function lookups(): JsonResponse
    {
        return response()->json([
            'business_models'   => \App\Models\Lookup\BusinessModel::where('is_active', true)->select('id', 'name', 'description')->get(),
            'areas'             => \App\Models\Lookup\Area::select('id', 'name')->get(),
            'zones'             => \App\Models\Lookup\Zone::select('id', 'name')->get(),
            'territories'       => \App\Models\Lookup\Territory::select('id', 'name')->get(),
            'account_managers'  => \App\Models\User::select('id', 'name', 'email')->get(),
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = Partner::query()
            ->with(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager']);

        // Full-text search across key identifier columns
        if ($search = trim((string) $request->query('search'))) {
            $q->where(function ($w) use ($search) {
                $w->where('partner_name', 'like', "%{$search}%")
                    ->orWhere('partner_code', 'like', "%{$search}%")
                    ->orWhere('partner_id', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        // Exact-match filters
        foreach (['status', 'partner_type', 'partner_category', 'territory_id', 'zone_id', 'area_id', 'account_manager_id', 'relationship_manager_id'] as $col) {
            if ($v = $request->query($col)) {
                $q->where($col, $v);
            }
        }

        // Sorting — only allow whitelisted columns
        $allowedSorts = ['partner_name', 'partner_code', 'status', 'partner_since', 'health_score', 'created_at'];
        $sort = in_array($request->query('sort'), $allowedSorts, true)
            ? $request->query('sort') : 'created_at';
        $dir = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $perPage = min((int) $request->query('per_page', 20), 100);

        return PartnerResource::collection(
            $q->orderBy($sort, $dir)->paginate($perPage)->withQueryString()
        );
    }

    /**
     *  create a new partner.
     */
    public function store(Request $request): PartnerResource
    {
        $data = $this->validated($request);

        $partner = Partner::create($data);

        // Sync Business Models if provided (BR-01)
        if ($request->has('business_model_ids')) {
            $partner->businessModels()->sync($request->input('business_model_ids', []));
        }

        // Create 1:1 profile row if profile data provided
        if (! empty($data['profile'])) {
            $partner->profile()->create($data['profile']);
        }

        return new PartnerResource(
            $partner->load(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager'])
        );
    }

    /**
     *  single partner with all relations.
     */
    public function show(Partner $partner): PartnerResource
    {
        return new PartnerResource(
            $partner->load(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager', 'riskIndicators', 'insights'])
        );
    }

    /**
     * update partner (+ profile if provided).
     */
    public function update(Request $request, Partner $partner): PartnerResource
    {
        $data = $this->validated($request, $partner->id);

        $partner->update($data);

        if ($request->has('business_model_ids')) {
            $partner->businessModels()->sync($request->input('business_model_ids', []));
        }

        if (! empty($data['profile'])) {
            $partner->profile()->updateOrCreate(
                ['partner_id' => $partner->id],
                $data['profile']
            );
        }

        return new PartnerResource(
            $partner->fresh(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager'])
        );
    }

    /**
     * PUT Change partner status with audit reason.
     */
    public function changeStatus(Request $request, Partner $partner): PartnerResource
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:Draft,Pending Approval,Under Review,Approved,Active,Suspended,Blocked,Inactive,Terminated'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $partner->status;
        $partner->status = $validated['status'];
        $partner->save();

        if (! empty($validated['reason'])) {
            \App\Services\AuditLogService::log(
                action: 'status_changed',
                entity: $partner,
                oldValues: ['status' => $oldStatus],
                newValues: ['status' => $validated['status']],
                reason: $validated['reason']
            );
        }

        return new PartnerResource(
            $partner->fresh(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager'])
        );
    }

    /**
     *Approve or Reject a partner request.
     */
    public function approve(Request $request, Partner $partner): PartnerResource
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:Approved,Rejected'],
            'reason'   => ['nullable', 'string', 'max:1000'],
        ]);

        $newStatus = $validated['decision'] === 'Approved' ? 'Active' : 'Rejected';
        $oldStatus = $partner->status;

        $partner->status = $newStatus;
        $partner->save();

        \App\Services\AuditLogService::log(
            action: strtolower($validated['decision']),
            entity: $partner,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => $newStatus],
            reason: $validated['reason'] ?? "Partner request {$validated['decision']}"
        );

        return new PartnerResource(
            $partner->fresh(['profile', 'businessModels', 'territory', 'zone', 'area', 'accountManager', 'relationshipManager'])
        );
    }

    /**
     * soft delete (deleted_at set, row kept — BR-06).
     */
    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();

        return response()->json(['message' => 'Partner soft-deleted successfully.']);
    }

    // Private helpers
    /**
     * Validation rules
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $partnerCodeUnique = 'unique:partners,partner_code' . ($ignoreId ? ",{$ignoreId}" : '');
        $emailUnique       = 'nullable|email|max:255|unique:partners,email' . ($ignoreId ? ",{$ignoreId}" : '');

        $rules = [
            // --- partners table columns ---
            'partner_name'            => ['required', 'string', 'max:255'],
            'partner_code'            => ['nullable', 'string', 'max:20', $partnerCodeUnique],
            'legal_name'              => ['nullable', 'string', 'max:255'],
            'business_name'           => ['nullable', 'string', 'max:255'],
            'partner_type'            => ['required', 'in:Reseller,Distributor,ISP,Corporate,Individual'],
            'partner_category'        => ['nullable', 'in:A,B,C,D'],
            'contact_person'          => ['nullable', 'string', 'max:255'],
            'contact_number'          => ['nullable', 'string', 'max:50'],
            'email'                   => $emailUnique,
            'address'                 => ['nullable', 'string'],
            'territory_id'            => ['nullable', 'exists:territories,id'],
            'zone_id'                 => ['nullable', 'exists:zones,id'],
            'area_id'                 => ['nullable', 'exists:areas,id'],
            'account_manager_id'      => ['nullable', 'exists:users,id'],
            'relationship_manager_id' => ['nullable', 'exists:users,id'],
            'partner_since'           => ['nullable', 'date'],
            'status'                  => ['nullable', 'in:Draft,Pending Approval,Active,Suspended,Blocked,Inactive,Terminated'],
            'logo_path'               => ['nullable', 'string', 'max:500'],
            'business_model_ids'      => ['nullable', 'array'],
            'business_model_ids.*'    => ['exists:business_models,id'],
        ];

        // Nested profile validation — columns match partner_profiles migration exactly
        if ($request->has('profile')) {
            $rules['profile']                        = ['array'];
            $rules['profile.business_type']          = ['nullable', 'string', 'max:100'];
            $rules['profile.business_category']      = ['nullable', 'string', 'max:100'];
            $rules['profile.operating_area']         = ['nullable', 'string'];
            $rules['profile.contract_type']          = ['nullable', 'string', 'max:100'];
            $rules['profile.contract_start_date']    = ['nullable', 'date'];
            $rules['profile.contract_end_date']      = ['nullable', 'date', 'after_or_equal:profile.contract_start_date'];
            $rules['profile.payment_terms']          = ['nullable', 'string', 'max:100'];
            $rules['profile.credit_limit']           = ['nullable', 'numeric', 'min:0'];
            $rules['profile.credit_days']            = ['nullable', 'integer', 'min:0'];
            $rules['profile.security_deposit']       = ['nullable', 'numeric', 'min:0'];
            $rules['profile.billing_cycle']          = ['nullable', 'in:Monthly,Quarterly,Half-Yearly,Yearly'];
            $rules['profile.pricing_model']          = ['nullable', 'string', 'max:100'];
            $rules['profile.discount_policy']        = ['nullable', 'string'];
            $rules['profile.commission_model']       = ['nullable', 'string', 'max:100'];
            $rules['profile.notes']                  = ['nullable', 'string'];
        }

        return $request->validate($rules);
    }
}
