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
        ]);

        // Default admin user
        $admin = User::updateOrCreate(
            ['email' => 'admin@plexuscloud.com'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('Plexus@2025'),
            ]
        );

        $admin->assignRole('super-admin');

        // Demo manager user
        $manager = User::updateOrCreate(
            ['email' => 'manager@plexuscloud.com'],
            [
                'name'     => 'Demo Manager',
                'password' => Hash::make('Manager@2025'),
            ]
        );

        $manager->assignRole('manager');
    }
}
