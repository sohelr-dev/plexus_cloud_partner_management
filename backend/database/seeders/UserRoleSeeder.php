<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Super Admin',
                'email'    => 'admin@plexuscloud.com',
                'role'     => 'super-admin',
            ],
            [
                'name'     => 'Top Management',
                'email'    => 'management@plexuscloud.com',
                'role'     => 'management',
            ],
            [
                'name'     => 'Partner Manager',
                'email'    => 'manager@plexuscloud.com',
                'role'     => 'partner-manager',
            ],
            [
                'name'     => 'Sales Lead',
                'email'    => 'sales@plexuscloud.com',
                'role'     => 'sales',
            ],
            [
                'name'     => 'Marketing Lead',
                'email'    => 'marketing@plexuscloud.com',
                'role'     => 'marketing',
            ],
            [
                'name'     => 'Finance Executive',
                'email'    => 'finance@plexuscloud.com',
                'role'     => 'finance',
            ],
            [
                'name'     => 'Accounts Officer',
                'email'    => 'accounts@plexuscloud.com',
                'role'     => 'accounts',
            ],
            [
                'name'     => 'Network Operations Lead',
                'email'    => 'network@plexuscloud.com',
                'role'     => 'network',
            ],
            [
                'name'     => 'Inventory Manager',
                'email'    => 'inventory@plexuscloud.com',
                'role'     => 'inventory',
            ],
            [
                'name'     => 'Support Center Lead',
                'email'    => 'support@plexuscloud.com',
                'role'     => 'support-center-management',
            ],
            [
                'name'     => 'System Administrator',
                'email'    => 'sysadmin@plexuscloud.com',
                'role'     => 'system-admin',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name'     => $userData['name'],
                    'password' => Hash::make('password'),
                    'status'   => 'Active',
                ]
            );

            // Ensure role exists in api guard
            Role::firstOrCreate(['name' => $userData['role'], 'guard_name' => 'api']);
            $user->syncRoles([$userData['role']]);
        }

        $this->command->info('✅ All 11 department role users seeded successfully.');
    }
}
