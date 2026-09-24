<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * RolesAndPermissionsSeeder
 *
 * Implements the exact 10 roles from PRD Section 92 with a proper
 * permission matrix. The guard is 'api' (Sanctum token auth).
 *
 * ROLES:
 *   1.  super-admin           — full bypass via Gate::before
 *   2.  management            — read everything, approve partners
 *   3.  partner-manager       — full partner CRUD + approve
 *   4.  sales                 — partner view/create + marketing
 *   5.  marketing             — marketing module only
 *   6.  finance               — financial + commission + payments + approve
 *   7.  accounts              — partner-account, payments, commission view
 *   8.  network               — bandwidth + equipment + devices
 *   9.  inventory             — equipment + devices
 *   10. support-center-mgmt   — support-center CRUD + partner view
 *   11. system-admin          — users + roles + settings
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── 1. PERMISSIONS ───────────────────────────────────────────────
        $modules = [
            'partner'           => ['view', 'create', 'update', 'delete', 'approve'],
            'partner-profile'   => ['view', 'update'],
            'bandwidth'         => ['view', 'create', 'update', 'delete', 'approve'],
            'equipment'         => ['view', 'create', 'update', 'delete'],
            'device'            => ['view', 'create', 'update', 'delete'],
            'commission'        => ['view', 'create', 'update', 'delete', 'approve', 'pay'],
            'payment'           => ['view', 'create', 'update', 'approve'],
            'revenue'           => ['view', 'create'],
            'cost'              => ['view', 'create'],
            'support-center'    => ['view', 'create', 'update', 'delete'],
            'partner-account'   => ['view', 'create', 'update'],
            'document'          => ['view', 'upload', 'delete'],
            'marketing'         => ['view', 'create', 'update'],
            'risk'              => ['view', 'manage'],
            'report'            => ['view', 'export'],
            'audit-log'         => ['view'],
            'user'              => ['view', 'create', 'update', 'delete'],
            'role'              => ['view', 'manage'],
            'setting'           => ['view', 'manage'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name'       => "{$module}.{$action}",
                    'guard_name' => 'api',
                ]);
            }
        }

        // Helper to sync by name strings
        $perms = fn (array $names) => Permission::whereIn('name', $names)
            ->where('guard_name', 'api')
            ->get();

        // ─── 2. ROLES ─────────────────────────────────────────────────────

        // 1. super-admin — bypass via Gate::before, no explicit permissions needed
        Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'api']);

        // 2. management — read-only across all + partner approve
        $management = Role::firstOrCreate(['name' => 'management', 'guard_name' => 'api']);
        $management->syncPermissions($perms([
            'partner.view', 'partner.approve', 'partner-profile.view',
            'bandwidth.view', 'equipment.view', 'device.view',
            'commission.view', 'commission.approve',
            'payment.view', 'payment.approve',
            'revenue.view', 'cost.view',
            'support-center.view', 'partner-account.view',
            'document.view', 'marketing.view',
            'risk.view', 'report.view', 'report.export',
            'audit-log.view',
        ]));

        // 3. partner-manager — full partner lifecycle
        $partnerManager = Role::firstOrCreate(['name' => 'partner-manager', 'guard_name' => 'api']);
        $partnerManager->syncPermissions($perms([
            'partner.view', 'partner.create', 'partner.update', 'partner.delete', 'partner.approve',
            'partner-profile.view', 'partner-profile.update',
            'bandwidth.view', 'bandwidth.create', 'bandwidth.update',
            'document.view', 'document.upload',
            'support-center.view',
            'risk.view', 'report.view', 'report.export',
            'audit-log.view',
        ]));

        // 4. sales — partner management + marketing read
        $sales = Role::firstOrCreate(['name' => 'sales', 'guard_name' => 'api']);
        $sales->syncPermissions($perms([
            'partner.view', 'partner.create', 'partner.update',
            'partner-profile.view', 'partner-profile.update',
            'marketing.view', 'marketing.create', 'marketing.update',
            'document.view', 'document.upload',
            'report.view',
        ]));

        // 5. marketing — marketing module only
        $marketing = Role::firstOrCreate(['name' => 'marketing', 'guard_name' => 'api']);
        $marketing->syncPermissions($perms([
            'partner.view',
            'marketing.view', 'marketing.create', 'marketing.update',
            'report.view', 'report.export',
        ]));

        // 6. finance — financial full + commission approve + pay
        $finance = Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'api']);
        $finance->syncPermissions($perms([
            'partner.view', 'partner-profile.view',
            'revenue.view', 'revenue.create',
            'cost.view', 'cost.create',
            'payment.view', 'payment.create', 'payment.update', 'payment.approve',
            'commission.view', 'commission.approve', 'commission.pay',
            'partner-account.view', 'partner-account.create', 'partner-account.update',
            'report.view', 'report.export',
        ]));

        // 7. accounts — consolidated financial view + payment entry
        $accounts = Role::firstOrCreate(['name' => 'accounts', 'guard_name' => 'api']);
        $accounts->syncPermissions($perms([
            'partner.view', 'partner-profile.view',
            'payment.view', 'payment.create',
            'commission.view',
            'partner-account.view', 'partner-account.create', 'partner-account.update',
            'revenue.view', 'cost.view',
            'report.view', 'report.export',
        ]));

        // 8. network — bandwidth + equipment + devices
        $network = Role::firstOrCreate(['name' => 'network', 'guard_name' => 'api']);
        $network->syncPermissions($perms([
            'partner.view', 'partner-profile.view',
            'bandwidth.view', 'bandwidth.create', 'bandwidth.update', 'bandwidth.delete', 'bandwidth.approve',
            'equipment.view', 'equipment.create', 'equipment.update', 'equipment.delete',
            'device.view', 'device.create', 'device.update', 'device.delete',
            'report.view',
        ]));

        // 9. inventory — equipment + devices (narrower than network)
        $inventory = Role::firstOrCreate(['name' => 'inventory', 'guard_name' => 'api']);
        $inventory->syncPermissions($perms([
            'partner.view',
            'equipment.view', 'equipment.create', 'equipment.update',
            'device.view', 'device.create', 'device.update',
            'report.view',
        ]));

        // 10. support-center-management — SC CRUD + partner read
        $scMgmt = Role::firstOrCreate(['name' => 'support-center-management', 'guard_name' => 'api']);
        $scMgmt->syncPermissions($perms([
            'partner.view', 'partner-profile.view',
            'support-center.view', 'support-center.create', 'support-center.update', 'support-center.delete',
            'equipment.view',
            'report.view',
        ]));

        // 11. system-admin — users, roles, settings (not financial data)
        $sysAdmin = Role::firstOrCreate(['name' => 'system-admin', 'guard_name' => 'api']);
        $sysAdmin->syncPermissions($perms([
            'user.view', 'user.create', 'user.update', 'user.delete',
            'role.view', 'role.manage',
            'setting.view', 'setting.manage',
            'audit-log.view',
            'report.view',
        ]));

        $this->command->info('✅ 11 roles + ' . Permission::count() . ' permissions seeded successfully.');
    }
}
