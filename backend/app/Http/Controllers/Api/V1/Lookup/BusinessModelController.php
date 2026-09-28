<?php

namespace App\Http\Controllers\Api\V1\Lookup;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Lookup\BusinessModel;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BusinessModelController extends ApiController
{

    public function index(): JsonResponse
    {
        $models = BusinessModel::withCount('partners')
            ->orderBy('id', 'asc')
            ->get();

        return $this->success($models, 'Business models retrieved successfully');
    }


    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:100|unique:business_models,name',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $data = $validator->validated();
        $data['is_active'] = $data['is_active'] ?? true;

        $model = BusinessModel::create($data);

        AuditLogService::log(
            action: 'business_model.created',
            entity: $model,
            oldValues: null,
            newValues: $model->toArray(),
            reason: "Business Model [{$model->name}] created."
        );

        return $this->success($model, 'Business model created successfully', 201);
    }

 
    public function update(Request $request, BusinessModel $businessModel): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => "sometimes|required|string|max:100|unique:business_models,name,{$businessModel->id}",
            'description' => 'nullable|string|max:500',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $old = $businessModel->toArray();
        $businessModel->update($validator->validated());

        AuditLogService::log(
            action: 'business_model.updated',
            entity: $businessModel,
            oldValues: $old,
            newValues: $businessModel->fresh()->toArray(),
            reason: "Business Model [{$businessModel->name}] updated."
        );

        return $this->success($businessModel->fresh(), 'Business model updated successfully');
    }

    public function destroy(BusinessModel $businessModel): JsonResponse
    {
        $partnerCount = $businessModel->partners()->count();
        if ($partnerCount > 0) {
            return $this->error("Cannot delete business model [{$businessModel->name}] because it is currently assigned to {$partnerCount} partner(s). Consider deactivating it instead.", 422);
        }

        $old = $businessModel->toArray();
        $businessModel->delete();

        AuditLogService::log(
            action: 'business_model.deleted',
            entity: $businessModel,
            oldValues: $old,
            newValues: null,
            reason: "Business Model [{$businessModel->name}] deleted."
        );

        return $this->success(null, "Business model [{$businessModel->name}] deleted successfully");
    }
}
