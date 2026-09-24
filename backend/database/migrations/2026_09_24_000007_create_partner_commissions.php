<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commission module tables (ERD):
 * partner_commission_rules, partner_commissions,
 * partner_commission_payments, partner_commission_adjustments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('rule_name', 255);
            $table->string('service', 100)->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('commission_type', 50)->index()
                ->comment('Percentage/Fixed Amount/Per Customer/Per Activation/Per Renewal/Per Package/Revenue Based/Bandwidth Based/Custom');
            $table->decimal('rate', 8, 2)->default(0);
            $table->decimal('fixed_amount', 15, 2)->default(0);
            $table->decimal('target', 15, 2)->default(0);
            $table->decimal('maximum_limit', 15, 2)->default(0);
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Inactive/Expired');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rule_id')->nullable()
                ->constrained('partner_commission_rules')->nullOnDelete();
            $table->string('source_reference', 100)->nullable()
                ->comment('Revenue Transaction ID');
            $table->decimal('source_amount', 15, 2)->default(0);
            $table->decimal('commission_amount', 15, 2)->default(0);
            $table->unsignedTinyInteger('period_month')->nullable();
            $table->unsignedSmallInteger('period_year')->nullable();
            $table->string('status', 50)->default('Generated')->index()
                ->comment('Generated/Pending/Calculated/Approved/Payable/Paid/Rejected/Cancelled/Reversed');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_commission_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commission_id')->nullable()
                ->constrained('partner_commissions')->nullOnDelete();
            $table->date('payment_date')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('payment_method', 50)->nullable();
            $table->string('reference_number', 100)->nullable();
            $table->string('status', 50)->default('Pending')->index()
                ->comment('Pending/Paid/Failed');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('partner_commission_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('commission_id')->nullable()
                ->constrained('partner_commissions')->nullOnDelete();
            $table->string('adjustment_type', 50)->index()
                ->comment('Reversal/Correction/Bonus/Penalty');
            $table->decimal('amount', 15, 2);
            $table->text('reason')->nullable();
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('adjusted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_commission_adjustments');
        Schema::dropIfExists('partner_commission_payments');
        Schema::dropIfExists('partner_commissions');
        Schema::dropIfExists('partner_commission_rules');
    }
};
