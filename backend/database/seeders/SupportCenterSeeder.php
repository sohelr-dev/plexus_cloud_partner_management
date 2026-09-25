<?php

namespace Database\Seeders;

use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\SupportCenter\PartnerSupportCenterCost;
use App\Models\SupportCenter\PartnerSupportCenterEquipment;
use App\Models\SupportCenter\PartnerSupportCenterHistory;
use App\Models\SupportCenter\PartnerSupportCenterService;
use App\Models\SupportCenter\PartnerSupportCenterStaff;
use Illuminate\Database\Seeder;

/**
 * Support Center sample data
 */
class SupportCenterSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();
        if (!$partner || PartnerSupportCenter::count() > 0) return;

        $branches = [
            [
                'center_name'      => 'Mirpur Support Center',
                'branch_type'      => 'Branch',
                'address'          => 'Plot 12, Road 4, Mirpur-10, Dhaka',
                'status'           => 'Active',
                'working_hours'    => '09:00 - 18:00',
                'weekly_off_day'   => 'Friday',
                'opening_date'     => now()->subMonths(14)->toDateString(),
                'service_coverage' => 'Mirpur-1 to Mirpur-12',
                'staff'            => [
                    ['staff_name' => 'Rahim Uddin', 'staff_category' => 'Branch Manager', 'designation' => 'Branch Manager', 'monthly_cost' => 35000, 'status' => 'Active'],
                    ['staff_name' => 'Jashim Ali', 'staff_category' => 'Customer Service', 'designation' => 'CS Executive', 'monthly_cost' => 18000, 'status' => 'Active'],
                    ['staff_name' => null, 'staff_category' => 'Technical Staff', 'designation' => 'Field Technician', 'monthly_cost' => 0, 'status' => 'Vacant'],
                    ['staff_name' => 'Sabbir Khan', 'staff_category' => 'Technical Staff', 'designation' => 'Sr. Technician', 'monthly_cost' => 22000, 'status' => 'Active'],
                ],
                'costs'            => [
                    ['cost_type' => 'Rent', 'amount' => 25000, 'cost_date' => now()->startOfMonth()->toDateString(), 'description' => 'Monthly branch rent'],
                    ['cost_type' => 'Electricity', 'amount' => 6500, 'cost_date' => now()->startOfMonth()->toDateString(), 'description' => 'Utility bill'],
                    ['cost_type' => 'Internet', 'amount' => 3000, 'cost_date' => now()->startOfMonth()->toDateString(), 'description' => 'Branch connectivity'],
                ],
                'equipment'        => [
                    ['equipment_type' => 'Router', 'quantity' => 4],
                    ['equipment_type' => 'Computer', 'quantity' => 3],
                    ['equipment_type' => 'WiFi AP', 'quantity' => 2],
                    ['equipment_type' => 'UPS', 'quantity' => 1],
                ],
            ],
            [
                'center_name'      => 'Uttara Support Center',
                'branch_type'      => 'Franchise',
                'address'          => 'Sector 7, Uttara, Dhaka',
                'status'           => 'Active',
                'working_hours'    => '10:00 - 19:00',
                'weekly_off_day'   => 'Sunday',
                'opening_date'     => now()->subMonths(6)->toDateString(),
                'service_coverage' => 'Uttara Sector 1-13',
                'staff'            => [
                    ['staff_name' => 'Tanvir Hasan', 'staff_category' => 'Branch Manager', 'designation' => 'Franchise Manager', 'monthly_cost' => 30000, 'status' => 'Active'],
                    ['staff_name' => 'Mizanur Rahman', 'staff_category' => 'Sales Staff', 'designation' => 'Sales Executive', 'monthly_cost' => 16000, 'status' => 'Active'],
                ],
                'costs'            => [
                    ['cost_type' => 'Rent', 'amount' => 18000, 'cost_date' => now()->startOfMonth()->toDateString(), 'description' => 'Franchise rent'],
                ],
                'equipment'        => [
                    ['equipment_type' => 'Computer', 'quantity' => 2],
                    ['equipment_type' => 'Printer', 'quantity' => 1],
                ],
            ],
            [
                'center_name'      => 'Chattogram Support Center',
                'branch_type'      => 'Support Center',
                'address'          => 'Agrabad, Chattogram',
                'status'           => 'Planned',
                'working_hours'    => '09:00 - 17:00',
                'weekly_off_day'   => 'Friday',
                'opening_date'     => now()->addMonths(2)->toDateString(),
                'service_coverage' => 'Agrabad & GEC Circle',
                'staff'            => [],
                'costs'            => [],
                'equipment'        => [],
            ],
        ];

        foreach ($branches as $branchData) {
            $staffData    = $branchData['staff'];
            $costData     = $branchData['costs'];
            $equipData    = $branchData['equipment'];
            unset($branchData['staff'], $branchData['costs'], $branchData['equipment']);

            $center = PartnerSupportCenter::create(array_merge($branchData, [
                'partner_id'  => $partner->id,
                'staff_count' => count(array_filter($staffData, fn($s) => ($s['status'] ?? 'Active') === 'Active')),
            ]));

            PartnerSupportCenterHistory::create([
                'support_center_id' => $center->id,
                'event_type'        => 'Created',
                'remarks'           => "Support Center '{$center->center_name}' created.",
                'event_date'        => now(),
            ]);

            if ($center->status === 'Active') {
                PartnerSupportCenterHistory::create([
                    'support_center_id' => $center->id,
                    'event_type'        => 'Opened',
                    'remarks'           => "Branch opened ({$center->opening_date}).",
                    'event_date'        => now(),
                ]);
            }

            foreach ($staffData as $staff) {
                PartnerSupportCenterStaff::create(array_merge($staff, ['support_center_id' => $center->id]));
            }

            foreach ($costData as $cost) {
                PartnerSupportCenterCost::create(array_merge($cost, ['support_center_id' => $center->id]));
            }

            foreach ($equipData as $eq) {
                PartnerSupportCenterEquipment::create(array_merge($eq, ['support_center_id' => $center->id]));
            }

            PartnerSupportCenterService::create([
                'support_center_id'  => $center->id,
                'service_area'       => $center->service_coverage,
                'coverage_area'      => $center->service_coverage,
                'supported_services' => 'Internet, GGC, BDIX, Customer Support',
                'customer_capacity'  => 500,
            ]);
        }
    }
}
