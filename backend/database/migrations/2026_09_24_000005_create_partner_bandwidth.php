<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bandwidth module tables (all 1:N from partners).
 * ERD: partner_bandwidth_allocations, partner_bandwidth_changes,
 *      partner_bandwidth_history, partner_bandwidth_approvals.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_bandwidth_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('service', 50)->index()
                ->comment('Internet/GGC/FNA/BDIX/Other');
            $table->decimal('allocated_mbps', 10, 2);
            $table->decimal('used_mbps', 10, 2)->default(0);
            $table->decimal('available_mbps', 10, 2)->default(0);
            $table->decimal('utilization_percent', 8, 2)->default(0);
            $table->string('ratio', 20)->nullable()->comment('1:8');
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('cost', 15, 2)->default(0);
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status', 50)->index()
                ->comment('Active/Expired/Suspended/Pending');
            $table->string('work_order_id', 100)->nullable();
            $table->foreignId('approval_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_bandwidth_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('allocation_id')->nullable()
                ->constrained('partner_bandwidth_allocations')->nullOnDelete();
            $table->string('change_type', 50)->nullable()
                ->comment('Upgrade/Downgrade/Temporary/Emergency/Administrative');
            $table->decimal('previous_mbps', 10, 2)->nullable();
            $table->decimal('new_mbps', 10, 2)->nullable();
            $table->decimal('difference_mbps', 10, 2)->nullable();
            $table->decimal('revenue_impact', 15, 2)->default(0);
            $table->decimal('cost_impact', 15, 2)->default(0);
            $table->decimal('profit_impact', 15, 2)->default(0);
            $table->text('reason')->nullable();
            $table->date('effective_date')->nullable();
            $table->foreignId('requester_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('supporting_document', 500)->nullable();
            $table->string('status', 50)->default('Requested')->index()
                ->comment('Requested/Capacity Check/Commercial Review/Approved/Rejected/Completed');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_bandwidth_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('allocation_id')->nullable()
                ->constrained('partner_bandwidth_allocations')->nullOnDelete();
            $table->foreignId('change_id')->nullable()
                ->constrained('partner_bandwidth_changes')->nullOnDelete();
            $table->string('event_type', 50)
                ->comment('Allocated/Upgraded/Downgraded/Suspended/Resumed/Expired');
            $table->decimal('previous_value', 10, 2)->nullable();
            $table->decimal('new_value', 10, 2)->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('partner_bandwidth_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_id')->constrained('partner_bandwidth_changes')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('approval_level')->default(1);
            $table->string('status', 50)->default('Pending')
                ->comment('Pending/Approved/Rejected');
            $table->string('decision', 20)->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_bandwidth_approvals');
        Schema::dropIfExists('partner_bandwidth_history');
        Schema::dropIfExists('partner_bandwidth_changes');
        Schema::dropIfExists('partner_bandwidth_allocations');
    }
};
