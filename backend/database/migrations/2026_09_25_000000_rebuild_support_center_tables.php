<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Support Center Module.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('support_center_assignments');
        Schema::dropIfExists('support_center_users');
        Schema::dropIfExists('support_centers');

        Schema::create('partner_support_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('sc_id', 50)->unique()
                ->comment('SC-000101 format — generated on boot');
            $table->string('branch_code', 50)->unique();
            $table->string('center_name', 255);
            $table->string('branch_type', 50)->default('Branch')
                ->comment('Head Office/Branch/Support Center/Franchise');
            $table->text('address')->nullable();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->string('contact_number', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->foreignId('branch_manager_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->unsignedInteger('staff_count')->default(0)
                ->comment('Cached count — real data in _staff table');
            $table->string('working_hours', 100)->nullable();
            $table->string('weekly_off_day', 50)->nullable();
            $table->date('opening_date')->nullable();
            $table->text('service_coverage')->nullable();
            $table->string('status', 50)->default('Planned')->index()
                ->comment('Planned/Active/Temporarily Closed/Suspended/Closed');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_support_center_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained('partner_support_centers')->cascadeOnDelete();
            $table->string('staff_name', 255)->nullable();
            $table->string('staff_category', 50)->index()
                ->comment('Branch Manager/Customer Service/Technical Staff/Sales Staff/Marketing Staff/Accounts Staff/Other Staff');
            $table->string('designation', 100)->nullable();
            $table->string('contact_number', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->date('joining_date')->nullable();
            $table->decimal('monthly_cost', 15, 2)->default(0);
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Vacant/Resigned/Terminated');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_support_center_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained('partner_support_centers')->cascadeOnDelete();
            $table->text('service_area')->nullable();
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->foreignId('territory_id')->nullable()->constrained('territories')->nullOnDelete();
            $table->text('coverage_area')->nullable();
            $table->text('supported_services')->nullable();
            $table->unsignedInteger('customer_capacity')->default(0);
            $table->timestamps();
        });

        Schema::create('partner_support_center_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained('partner_support_centers')->cascadeOnDelete();
            $table->date('cost_date')->index();
            $table->string('cost_type', 50)
                ->comment('Rent/Electricity/Internet/Staff Cost/Equipment Cost/Maintenance/Transportation/Marketing/Other');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_support_center_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained('partner_support_centers')->cascadeOnDelete();
            $table->foreignId('equipment_id')->nullable()
                ->comment('Optional link to partner_equipment (central inventory)');
            $table->string('equipment_type', 50)
                ->comment('Router/ONU/Switch/Computer/Printer/WiFi AP/UPS/CCTV/Network Equipment/Office Equipment');
            $table->unsignedInteger('quantity')->default(1);
            $table->string('status', 50)->default('Active')->index();
            $table->timestamps();
        });

        Schema::create('partner_support_center_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained('partner_support_centers')->cascadeOnDelete();
            $table->string('event_type', 50)->index()
                ->comment('Created/Opened/Manager Changed/Staff Changed/Location Changed/Coverage Changed/Equipment Added/Equipment Removed/Cost Changed/Suspended/Closed');
            $table->text('remarks')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('event_date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_support_center_history');
        Schema::dropIfExists('partner_support_center_equipment');
        Schema::dropIfExists('partner_support_center_costs');
        Schema::dropIfExists('partner_support_center_services');
        Schema::dropIfExists('partner_support_center_staff');
        Schema::dropIfExists('partner_support_centers');
    }
};
