<?php

namespace Database\Seeders;

use App\Models\Lookup\Area;
use App\Models\Lookup\BusinessModel;
use App\Models\Lookup\Territory;
use App\Models\Lookup\Zone;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LookupSeeder extends Seeder
{
    public function run(): void
    {
        $models = [
            [
                'name' => 'Bandwidth Sales',
                'description' => 'Partners purchase or consume bandwidth and network services (Internet, GGC, FNA, BDIX).'
            ],
            [
                'name' => 'Commission Based',
                'description' => 'Partners earn commission based on configurable business rules (revenue %, fixed per activation, customer renewal).'
            ],
            [
                'name' => 'End Device Based',
                'description' => 'Relationship based on network endpoint devices (MAC, Router, ONU, ONT, CPE).'
            ],
            [
                'name' => 'Support Center',
                'description' => 'Partner operates physical/operational support centers or customer service branches.'
            ],
        ];

        foreach ($models as $m) {
            BusinessModel::updateOrCreate(['name' => $m['name']], $m);
        }

        // 2. Geographic Lookups (Territory -> Zone -> Area)
        $territory = Territory::updateOrCreate(['name' => 'Dhaka Division']);
        $zone = Zone::updateOrCreate(
            ['name' => 'Dhaka North Zone'],
            ['territory_id' => $territory->id]
        );
        Area::updateOrCreate(
            ['name' => 'Gulshan / Banani Area'],
            ['zone_id' => $zone->id]
        );
        Area::updateOrCreate(
            ['name' => 'Uttara Area'],
            ['zone_id' => $zone->id]
        );

        $zoneSouth = Zone::updateOrCreate(
            ['name' => 'Dhaka South Zone'],
            ['territory_id' => $territory->id]
        );
        Area::updateOrCreate(
            ['name' => 'Dhanmondi Area'],
            ['zone_id' => $zoneSouth->id]
        );

        // 3. Demo Account / Relationship Managers
        $pm1 = User::updateOrCreate(
            ['email' => 'partner.manager@plexuscloud.com'],
            [
                'name' => 'Tanvir Ahmed (Partner Manager)',
                'password' => Hash::make('password'),
            ]
        );
        $pm1->assignRole('partner-manager');

        $pm2 = User::updateOrCreate(
            ['email' => 'sales.manager@plexuscloud.com'],
            [
                'name' => 'Rafiqul Islam (Sales Lead)',
                'password' => Hash::make('password'),
            ]
        );
        $pm2->assignRole('sales');
    }
}
