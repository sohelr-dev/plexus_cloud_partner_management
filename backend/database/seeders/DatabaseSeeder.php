<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            LookupSeeder::class,
            FinancialSeeder::class,
        ]);

        $users = [
            [
                'name'     => 'Super Admin',
                'email'    => 'admin@plexuscloud.com',
                'role'     => 'super-admin',
            ],
            [
                'name'     => 'Partner Manager',
                'email'    => 'manager@plexuscloud.com',
                'role'     => 'partner-manager',
            ],
            [
                'name'     => 'Finance Executive',
                'email'    => 'finance@plexuscloud.com',
                'role'     => 'finance',
            ],
            [
                'name'     => 'Sales Lead',
                'email'    => 'sales@plexuscloud.com',
                'role'     => 'sales',
            ],
            [
                'name'     => 'Network Engineer',
                'email'    => 'network@plexuscloud.com',
                'role'     => 'network',
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

            $user->syncRoles([$userData['role']]);
        }
    }
}
