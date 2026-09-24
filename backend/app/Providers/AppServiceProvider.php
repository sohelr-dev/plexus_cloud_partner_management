<?php

namespace App\Providers;

use App\Models\Partner\Partner;
use App\Observers\PartnerObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Partner::observe(PartnerObserver::class);

        // --- Super-Admin gate bypass ---
        // super-admin role bypasses ALL permission
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('super-admin')) {
                return true;
            }
        });
    }
}
