<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Financial core tables: revenues, costs, payments (all 1:N from partners).
 * ERD: partner_revenues, partner_costs, partner_payments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_revenues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->date('revenue_date')->index();
            $table->string('revenue_source', 100)->index()
                ->comment('Bandwidth Sales/Internet/GGC/FNA/BDIX/Package Sales/Activation Fee/etc');
            $table->string('source_reference', 100)->nullable()->comment('Invoice ID / Txn ID');
            $table->string('source_system', 100)->nullable()->comment('Billing / ERP');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->date('cost_date')->index();
            $table->string('cost_type', 100)->index()
                ->comment('Bandwidth Cost/Upstream Cost/Commission/Equipment Cost/etc');
            $table->string('source_reference', 100)->nullable();
            $table->string('source_system', 100)->nullable();
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->date('payment_date')->index();
            $table->string('payment_method', 50)->nullable()
                ->comment('Cash/Bank Transfer/Cheque/Online/Adjustment');
            $table->decimal('amount', 15, 2);
            $table->string('reference_number', 100)->nullable();
            $table->string('status', 50)->default('Pending')
                ->comment('Pending/Completed/Failed/Reversed');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_payments');
        Schema::dropIfExists('partner_costs');
        Schema::dropIfExists('partner_revenues');
    }
};
