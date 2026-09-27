<?php

namespace Tests\Feature;

use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\SupportCenter\PartnerSupportCenterEquipment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    private Partner $partner;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->partner = Partner::create([
            'partner_name'     => 'Secure Communications',
            'partner_type'     => 'ISP',
            'partner_category' => 'A',
            'status'           => 'Active',
            'contact_person'   => 'Security Admin',
            'contact_number'   => '01733333333',
            'email'            => 'sec@test.com',
        ]);
    }

    /**
     * RBAC Test: Marketing role CANNOT create financial records (403 Forbidden).
     */
    public function test_marketing_role_cannot_create_financial_records(): void
    {
        $marketingUser = User::create([
            'name'     => 'Marketing Officer',
            'email'    => 'mkt@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
        $marketingUser->assignRole('marketing');

        Sanctum::actingAs($marketingUser, ['*']);

        $response = $this->postJson('/api/v1/financial/revenues', [
            'partner_id'     => $this->partner->id,
            'revenue_date'   => now()->toDateString(),
            'revenue_source' => 'Bandwidth Sales',
            'amount'         => 25000.0,
        ]);

        $response->assertStatus(403);
    }

    /**
     * RBAC Test: Finance role CAN create financial revenue records.
     */
    public function test_finance_role_can_create_financial_records(): void
    {
        $financeUser = User::create([
            'name'     => 'Finance Accountant',
            'email'    => 'fin@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
        $financeUser->assignRole('finance');

        Sanctum::actingAs($financeUser, ['*']);

        $response = $this->postJson('/api/v1/financial/revenues', [
            'partner_id'     => $this->partner->id,
            'revenue_date'   => now()->toDateString(),
            'revenue_source' => 'Bandwidth Sales',
            'amount'         => 35000.0,
            'description'    => 'Monthly bandwidth payment',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('partner_revenues', [
            'partner_id' => $this->partner->id,
            'amount'     => 35000.0,
        ]);
    }

    /**
     * IDOR Security Test :
     * A user cannot manipulate equipment belonging to Center A by specifying Center B in URL.
     */
    public function test_idor_support_center_equipment_isolation(): void
    {
        $admin = User::create([
            'name'     => 'Partner Admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
        $admin->assignRole('super-admin');
        Sanctum::actingAs($admin, ['*']);

        // Center A
        $centerA = PartnerSupportCenter::create([
            'partner_id'  => $this->partner->id,
            'center_name' => 'Center A - Uttara',
            'center_type' => 'Branch',
            'status'      => 'Active',
        ]);

        // Center B
        $centerB = PartnerSupportCenter::create([
            'partner_id'  => $this->partner->id,
            'center_name' => 'Center B - Mirpur',
            'center_type' => 'Branch',
            'status'      => 'Active',
        ]);

        // Equipment belongs to Center A
        $equipmentA = PartnerSupportCenterEquipment::create([
            'support_center_id' => $centerA->id,
            'equipment_type'    => 'Core Router',
            'quantity'          => 1,
            'status'            => 'Active',
        ]);

        // Attacker attempts to update Center A's equipment by passing Center B in URL:
        // PUT /api/v1/support-centers/{centerB}/equipment/{equipmentA}
        $response = $this->putJson("/api/v1/support-centers/{$centerB->id}/equipment/{$equipmentA->id}", [
            'equipment_type' => 'Hacked Router',
            'status'         => 'Decommissioned',
        ]);

        // Must reject with 404 (or 403) and not modify the record
        $response->assertStatus(404);
        $this->assertEquals('Core Router', $equipmentA->fresh()->equipment_type);
    }

    /**
     * File Upload Security Test :
     * Reject prohibited file types like .exe, .sh, .php
     */
    public function test_file_upload_validation_rejects_executable_files(): void
    {
        $manager = User::create([
            'name'     => 'Partner Manager User',
            'email'    => 'pm@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
        $manager->assignRole('partner-manager');
        Sanctum::actingAs($manager, ['*']);

        Storage::fake('local');

        $fakeMaliciousFile = UploadedFile::fake()->create('malicious_payload.exe', 100);

        $response = $this->postJson("/api/v1/partners/{$this->partner->id}/documents", [
            'document_name' => 'Injected File',
            'category'      => 'Legal',
            'document_type' => 'Trade License',
            'file'          => $fakeMaliciousFile,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['file']);
    }
}
