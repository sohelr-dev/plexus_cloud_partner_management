<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for Partner P&L (Profit & Loss) and ROI (Return on Investment)
 * PRD Section 31 (P&L Calculation) & Section 34-35 (ROI Tracking)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_profit_losses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('period_type', 20)->default('Monthly')->index()->comment('Monthly/Quarterly/Yearly');
            $table->string('period_key', 20)->index()->comment('e.g. 2026-09 or 2026-Q3');
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->decimal('direct_cost', 15, 2)->default(0);
            $table->decimal('gross_profit', 15, 2)->default(0);
            $table->decimal('operating_cost', 15, 2)->default(0);
            $table->decimal('commission_cost', 15, 2)->default(0);
            $table->decimal('support_center_cost', 15, 2)->default(0);
            $table->decimal('net_profit', 15, 2)->default(0);
            $table->decimal('profit_margin_percent', 8, 2)->default(0);
            $table->decimal('total_invoiced', 15, 2)->default(0);
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('outstanding_balance', 15, 2)->default(0);
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();
            $table->unique(['partner_id', 'period_type', 'period_key']);
        });

        Schema::create('partner_rois', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('investment_category', 100)->index()
                ->comment('Security Deposit / Equipment Investment / Infrastructure / Marketing / Setup Cost / Credit Exposure / Other');
            $table->decimal('investment_amount', 15, 2)->default(0);
            $table->decimal('net_return_amount', 15, 2)->default(0);
            $table->decimal('roi_percent', 8, 2)->default(0);
            $table->decimal('payback_period_months', 8, 2)->nullable();
            $table->date('snapshot_date')->index();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_rois');
        Schema::dropIfExists('partner_profit_losses');
    }
};
