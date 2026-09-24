<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Module-based permission list + role matrix (PRD RBAC section).
     * Format: 'module.action'
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $modules = [
            'partner'        => ['view', 'create', 'update', 'delete'],
            'bandwidth'      => ['view', 'create', 'update', 'delete', 'approve'],
            'equipment'      => ['view', 'create', 'update', 'delete'],
            'device'         => ['view', 'create', 'update', 'delete'],
            'commission'     => ['view', 'create', 'update', 'delete', 'approve'],
            'payment'        => ['view', 'create', 'update', 'delete', 'approve'],
            'support-center' => ['view', 'create', 'update', 'delete'],
            'partner-account' => ['view', 'create', 'update', 'delete'],
            'risk'           => ['view', 'manage'],
            'report'         => ['view', 'export'],
            'user'           => ['view', 'create', 'update', 'delete'],
            'role'           => ['view', 'manage'],
            'setting'        => ['view', 'manage'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}", 'guard_name' => 'api']);
            }
        }

        // Roles (super-admin gets everything via Gate::before, defined in AppServiceProvider)
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'api']);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions(Permission::all()
            ->filter(fn($p) => ! str_starts_with($p->name, 'role.') && ! str_starts_with($p->name, 'setting.'))
            ->merge([
                Permission::where('name', 'user.view')->first(),
                Permission::where('name', 'user.create')->first(),
                Permission::where('name', 'user.update')->first(),
            ]));

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'api']);
        $manager->syncPermissions(Permission::all()->filter(
            fn($p) => ! str_ends_with($p->name, '.delete') && ! str_ends_with($p->name, '.approve') && ! str_ends_with($p->name, '.manage')
        ));

        $finance = Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'api']);
        $finance->syncPermissions([
            'payment.view',
            'payment.create',
            'payment.update',
            'commission.view',
            'commission.create',
            'commission.update',
            'partner-account.view',
            'partner-account.create',
            'partner-account.update',
            'report.view',
            'report.export',
        ]);

        $support = Role::firstOrCreate(['name' => 'support', 'guard_name' => 'api']);
        $support->syncPermissions([
            'partner.view',
            'support-center.view',
            'support-center.create',
            'support-center.update',
            'device.view',
            'equipment.view',
        ]);

        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'api']);
        $viewer->syncPermissions(
            Permission::all()->filter(fn($p) => str_ends_with($p->name, '.view'))
        );
    }
}
