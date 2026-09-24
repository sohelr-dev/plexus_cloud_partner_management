<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core partner master table + 1:1 profile.
 * ERD: partners, partner_profiles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('partner_id', 20)->unique()->comment('PT-000125');
            $table->string('partner_code', 20)->unique()->comment('ABC-00125');
            $table->string('partner_name');
            $table->string('legal_name')->nullable();
            $table->string('business_name')->nullable();
            $table->string('partner_type', 50)->comment('Reseller/Distributor/ISP/Corporate/Individual');
            $table->string('partner_category', 10)->nullable()->comment('A/B/C/D');
            $table->string('contact_person')->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();

            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('territory_id')->nullable()->constrained()->nullOnDelete();

            $table->foreignId('account_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('relationship_manager_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('partner_since')->nullable();
            $table->string('status', 50)->default('Draft')->index()
                ->comment('Draft/Pending Approval/Active/Suspended/Blocked/Inactive/Terminated');
            $table->decimal('health_score', 5, 2)->default(0);
            $table->string('health_status', 20)->nullable()->comment('Excellent/Healthy/Watch/Risk/Critical');
            $table->string('logo_path', 500)->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_type', 100)->nullable();
            $table->string('business_category', 100)->nullable();
            $table->text('operating_area')->nullable();
            $table->string('contract_type', 100)->nullable();
            $table->date('contract_start_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->string('payment_terms', 100)->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->integer('credit_days')->default(0);
            $table->decimal('security_deposit', 15, 2)->default(0);
            $table->string('billing_cycle', 50)->nullable()->comment('Monthly/Quarterly/Half-Yearly/Yearly');
            $table->string('pricing_model', 100)->nullable();
            $table->text('discount_policy')->nullable();
            $table->string('commission_model', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_profiles');
        Schema::dropIfExists('partners');
    }
};
