<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Partner Risk & Insights tables (ERD):
 * partner_risk_indicators, partner_insights.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_risk_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('risk_category', 50)->nullable()->index()
                ->comment('Financial/Marketing/Network/Equipment/Support Center/Contract');
            $table->string('risk_type', 100);
            $table->string('risk_level', 20)->default('Low')->index()
                ->comment('Low/Medium/High/Critical');
            $table->text('description')->nullable();
            $table->timestamp('detected_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->string('status', 20)->default('Active')->index()
                ->comment('Active/Resolved/Ignored');
            $table->timestamps();

            $table->index(['partner_id', 'status']);
        });

        Schema::create('partner_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->string('insight_type', 50)->nullable()->index()
                ->comment('Revenue/Bandwidth/Customer/Cost/Commission/Profitability/General');
            $table->text('insight_text');
            $table->json('insight_data')->nullable();
            $table->string('severity', 20)->default('Info')->index()
                ->comment('Info/Warning/Critical');
            $table->timestamp('generated_at')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['partner_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_insights');
        Schema::dropIfExists('partner_risk_indicators');
    }
};
