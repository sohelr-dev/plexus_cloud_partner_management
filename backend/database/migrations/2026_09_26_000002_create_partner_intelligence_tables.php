<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // partner_health_scores
        if (!Schema::hasTable('partner_health_scores')) {
            Schema::create('partner_health_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

                $table->decimal('total_score', 5, 2)->default(0);
                $table->string('status', 20)->default('Watch')
                    ->comment('Excellent|Healthy|Watch|Risk|Critical');

                $table->decimal('financial_health_score', 5, 2)->default(0)->comment('Weight 25%');
                $table->decimal('revenue_growth_score', 5, 2)->default(0)->comment('Weight 20%');
                $table->decimal('profitability_score', 5, 2)->default(0)->comment('Weight 20%');
                $table->decimal('payment_behavior_score', 5, 2)->default(0)->comment('Weight 10%');
                $table->decimal('bandwidth_growth_score', 5, 2)->default(0)->comment('Weight 10%');
                $table->decimal('customer_growth_score', 5, 2)->default(0)->comment('Weight 10%');
                $table->decimal('operational_score', 5, 2)->default(0)->comment('Weight 5%');

                $table->json('calculation_data')->nullable();
                $table->string('period', 7)->nullable()->comment('YYYY-MM');
                $table->foreignId('calculated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('calculated_at')->useCurrent();
                $table->timestamps();

                $table->index(['partner_id', 'period']);
                $table->index(['partner_id', 'calculated_at']);
            });
        }

        // partner_risk_indicators
        if (!Schema::hasTable('partner_risk_indicators')) {
            Schema::create('partner_risk_indicators', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

                $table->string('risk_category', 50)
                    ->comment('Financial|Marketing|Network|Equipment|Support Center|Contract');
                $table->string('risk_type', 100)
                    ->comment('e.g. outstanding_high, churn_high, utilization_high');
                $table->string('severity', 20)->default('Medium')
                    ->comment('Low|Medium|High|Critical');
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->json('trigger_data')->nullable()
                    ->comment('{"value": 91, "threshold": 90, "unit": "%"}');

                $table->boolean('is_active')->default(true);
                $table->timestamp('detected_at')->useCurrent();
                $table->timestamp('resolved_at')->nullable();

                $table->foreignId('detected_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['partner_id', 'is_active']);
                $table->index(['partner_id', 'risk_category']);
            });
        }

        // partner_insights
        if (!Schema::hasTable('partner_insights')) {
            Schema::create('partner_insights', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

                $table->string('type', 30)->default('insight')
                    ->comment('insight|recommendation');
                $table->string('category', 50)->nullable()
                    ->comment('Financial|Marketing|Network|Equipment|Support Center|Contract');
                $table->text('content');
                $table->string('action', 100)->nullable()
                    ->comment('e.g. Bandwidth Upgrade, Payment Follow-up');
                $table->json('data_points')->nullable()
                    ->comment('Supporting data that generated this insight');
                $table->string('priority', 20)->default('Medium')
                    ->comment('Low|Medium|High|Critical');

                $table->boolean('is_active')->default(true);
                $table->timestamp('generated_at')->useCurrent();
                $table->timestamps();

                $table->index(['partner_id', 'type', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_insights');
        Schema::dropIfExists('partner_risk_indicators');
        Schema::dropIfExists('partner_health_scores');
    }
};
