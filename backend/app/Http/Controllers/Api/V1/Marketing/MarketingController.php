<?php

namespace App\Http\Controllers\Api\V1\Marketing;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Services\MarketingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class MarketingController extends ApiController
{
    protected MarketingService $marketingService;

    public function __construct(MarketingService $marketingService)
    {
        $this->marketingService = $marketingService;
    }


    public function summary(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getSummary($partner),
            'Marketing summary loaded.'
        );
    }


    public function getCustomerGrowth(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getCustomerGrowth($partner),
            'Customer growth metrics loaded.'
        );
    }

    public function storeCustomerMetric(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'metric_date'       => 'required|date',
            'period_type'       => 'nullable|string|in:Daily,Weekly,Monthly,Quarterly,Yearly',
            'opening_customers' => 'nullable|integer|min:0',
            'new_customers'     => 'nullable|integer|min:0',
            'reactivations'     => 'nullable|integer|min:0',
            'renewals'          => 'nullable|integer|min:0',
            'suspensions'       => 'nullable|integer|min:0',
            'terminations'      => 'nullable|integer|min:0',
            'closing_customers' => 'nullable|integer|min:0',
        ]);

        $metric = $this->marketingService->recordCustomerMetric($partner, $validated);

        return $this->created($metric, 'Customer growth metric recorded.');
    }


    public function getSalesPerformance(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getSalesPerformance($partner),
            'Sales performance metrics loaded.'
        );
    }

  
    public function storeSalesMetric(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'metric_date'       => 'required|date',
            'period_type'       => 'nullable|string|in:Daily,Weekly,Monthly,Quarterly,Yearly',
            'sales_target'      => 'nullable|numeric|min:0',
            'actual_sales'      => 'nullable|numeric|min:0',
            'new_sales_count'   => 'nullable|integer|min:0',
            'total_revenue'     => 'nullable|numeric|min:0',
        ]);

        $metric = $this->marketingService->recordSalesMetric($partner, $validated);

        return $this->created($metric, 'Sales performance metric recorded.');
    }


    public function getPackagePerformance(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getPackagePerformance($partner),
            'Package performance metrics loaded.'
        );
    }


    public function getAreaMetrics(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getAreaMetrics($partner),
            'Area metrics loaded.'
        );
    }


    public function getCampaigns(Partner $partner): JsonResponse
    {
        return $this->success(
            $this->marketingService->getCampaigns($partner),
            'Campaigns loaded.'
        );
    }


    public function storeCampaign(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'type'             => 'nullable|string|max:100',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'target_customers' => 'nullable|integer|min:0',
            'target_revenue'   => 'nullable|numeric|min:0',
            'actual_customers' => 'nullable|integer|min:0',
            'actual_revenue'   => 'nullable|numeric|min:0',
            'campaign_cost'    => 'nullable|numeric|min:0',
            'status'           => 'nullable|string|in:Planned,Active,Completed,Cancelled',
            'remarks'          => 'nullable|string|max:1000',
        ]);

        $campaign = $this->marketingService->storeCampaign($partner, $validated, $request->user()?->id);

        return $this->created($campaign, 'Campaign created successfully.');
    }


    public function updateCampaign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'type'             => 'nullable|string|max:100',
            'start_date'       => 'sometimes|date',
            'end_date'         => 'sometimes|date|after_or_equal:start_date',
            'target_customers' => 'nullable|integer|min:0',
            'target_revenue'   => 'nullable|numeric|min:0',
            'actual_customers' => 'nullable|integer|min:0',
            'actual_revenue'   => 'nullable|numeric|min:0',
            'campaign_cost'    => 'nullable|numeric|min:0',
            'status'           => 'nullable|string|in:Planned,Active,Completed,Cancelled',
            'remarks'          => 'nullable|string|max:1000',
        ]);

        $campaign = $this->marketingService->updateCampaign($id, $validated, $request->user()?->id);

        return $this->success($campaign, 'Campaign updated successfully.');
    }

    public function destroyCampaign(int $id): JsonResponse
    {
        $this->marketingService->destroyCampaign($id);

        return $this->success(null, 'Campaign deleted successfully.');
    }
}
