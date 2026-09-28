<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        // 1. Partner Current Relationship Details
        Schema::create('partner_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('current_account_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('relationship_status', 50)->default('Active')->comment('Active/Inactive/On Hold');
            $table->date('last_meeting_date')->nullable();
            $table->date('next_follow_up_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. Partner Relationship Transfer History
        Schema::create('partner_relationship_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('previous_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('new_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('assignment_date')->nullable();
            $table->date('transfer_date')->nullable();
            $table->text('transfer_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['partner_id', 'transfer_date']);
        });

        // 3. Partner Periodic Financial Snapshots
        Schema::create('partner_financial_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date')->index();
            $table->decimal('total_invoiced', 15, 2)->default(0);
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('outstanding', 15, 2)->default(0);
            $table->decimal('overdue', 15, 2)->default(0);
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('credit_utilization', 8, 2)->default(0);
            $table->date('last_payment_date')->nullable();
            $table->date('next_due_date')->nullable();
            $table->integer('avg_payment_delay')->default(0)->comment('Days delay average');
            $table->timestamps();

            $table->unique(['partner_id', 'snapshot_date'], 'uk_partner_snapshot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_financial_snapshots');
        Schema::dropIfExists('partner_relationship_history');
        Schema::dropIfExists('partner_relationships');
    }
};
