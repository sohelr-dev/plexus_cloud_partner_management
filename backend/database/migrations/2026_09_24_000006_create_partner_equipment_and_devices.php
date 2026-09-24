<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Equipment & Device module tables (ERD):
 * partner_equipment, partner_equipment_assignments, partner_equipment_history,
 * partner_equipment_maintenance, partner_end_devices, partner_device_history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_equipment', function (Blueprint $table) {
            $table->id();
            $table->string('equipment_id', 50)->unique()->comment('Internal unique code');
            $table->string('asset_id', 50)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->string('mac_address', 50)->nullable();
            $table->string('equipment_type', 50)->index()
                ->comment('Router/ONU/ONT/OLT/Switch/CPE/Access Point/etc');
            $table->string('manufacturer', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('vendor', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 15, 2)->default(0);
            $table->date('installation_date')->nullable();
            $table->string('location', 255)->nullable();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('ownership', 50)->nullable()
                ->comment('Company Owned/Partner Owned/Customer Owned/Leased/Rented');
            $table->date('warranty_start')->nullable();
            $table->date('warranty_end')->nullable();
            $table->string('status', 50)->index()
                ->comment('Available/Assigned/Installed/Active/Faulty/Under Maintenance/Replaced/Returned/Lost/Retired');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_equipment_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')
                ->constrained('partner_equipment')->cascadeOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->date('assigned_date')->nullable();
            $table->date('returned_date')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Returned/Transferred');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('partner_equipment_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')
                ->constrained('partner_equipment')->cascadeOnDelete();
            $table->string('event_type', 50)->index()
                ->comment('Purchased/Assigned/Installed/Maintenance/Replaced/Returned/Retired');
            $table->date('event_date')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('partner_equipment_maintenance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')
                ->constrained('partner_equipment')->cascadeOnDelete();
            $table->date('maintenance_date')->nullable();
            $table->string('maintenance_type', 50)->index()
                ->comment('Preventive/Corrective/Emergency');
            $table->decimal('cost', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->string('performed_by', 255)->nullable();
            $table->date('next_due_date')->nullable();
            $table->string('status', 50)->default('Scheduled')->index()
                ->comment('Scheduled/In Progress/Completed');
            $table->timestamps();
        });

        Schema::create('partner_end_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('device_type', 50)->index()
                ->comment('MAC Address/Router/ONU/ONT/CPE/Device ID/Serial Number/Other');
            $table->string('identifier', 255)->index()->comment('MAC / Serial / Device ID');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Offline/Faulty/Replaced/Suspended/Retired');
            $table->date('activation_date')->nullable();
            $table->date('deactivation_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_device_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')
                ->constrained('partner_end_devices')->cascadeOnDelete();
            $table->string('event_type', 50)->index()
                ->comment('Added/Assigned/Activated/Suspended/Replaced/Returned/Retired');
            $table->timestamp('event_date')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_device_history');
        Schema::dropIfExists('partner_end_devices');
        Schema::dropIfExists('partner_equipment_maintenance');
        Schema::dropIfExists('partner_equipment_history');
        Schema::dropIfExists('partner_equipment_assignments');
        Schema::dropIfExists('partner_equipment');
    }
};
