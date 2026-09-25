<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partner_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->nullable(); // e.g., 'Promo', 'Discount', 'Activation'
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('target_customers')->default(0);
            $table->decimal('target_revenue', 15, 2)->default(0.00);
            $table->integer('actual_customers')->default(0);
            $table->decimal('actual_revenue', 15, 2)->default(0.00);
            $table->decimal('campaign_cost', 15, 2)->default(0.00);
            $table->decimal('campaign_profit', 15, 2)->default(0.00);
            $table->decimal('conversion_rate', 5, 2)->default(0.00);
            $table->decimal('roi', 10, 2)->default(0.00);
            $table->string('status')->default('Active'); // Planned, Active, Completed, Cancelled
            $table->text('remarks')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['partner_id', 'start_date']);
        });

        Schema::create('partner_customer_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->date('metric_date'); // Typically stored as first day of the month or specific date
            $table->enum('period_type', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'])->default('Monthly');
            
            $table->integer('opening_customers')->default(0);
            $table->integer('new_customers')->default(0);
            $table->integer('reactivations')->default(0);
            $table->integer('renewals')->default(0);
            $table->integer('suspensions')->default(0);
            $table->integer('terminations')->default(0);
            $table->integer('churn_customers')->default(0);
            $table->integer('closing_customers')->default(0);
            
            $table->decimal('growth_rate', 5, 2)->default(0.00); // (New / Opening) * 100
            $table->decimal('churn_rate', 5, 2)->default(0.00); // (Terminated / Opening Active) * 100
            
            $table->timestamps();
            
            $table->unique(['partner_id', 'metric_date', 'period_type'], 'partner_cust_metrics_unique');
        });

        Schema::create('partner_sales_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->date('metric_date');
            $table->enum('period_type', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'])->default('Monthly');
            
            $table->decimal('sales_target', 15, 2)->default(0.00);
            $table->decimal('actual_sales', 15, 2)->default(0.00);
            $table->decimal('achievement_percentage', 5, 2)->default(0.00); // (Actual / Target) * 100
            
            $table->integer('new_sales_count')->default(0);
            $table->integer('renewal_sales_count')->default(0);
            $table->integer('package_sales_count')->default(0);
            $table->integer('upgrade_sales_count')->default(0);
            $table->integer('downgrade_sales_count')->default(0);
            
            $table->decimal('total_revenue', 15, 2)->default(0.00);
            $table->decimal('average_revenue_per_customer', 15, 2)->default(0.00);
            
            $table->timestamps();
            
            $table->unique(['partner_id', 'metric_date', 'period_type'], 'partner_sales_metrics_unique');
        });

        Schema::create('partner_package_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->string('package_name');
            $table->date('metric_date');
            $table->enum('period_type', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'])->default('Monthly');
            
            $table->integer('customer_count')->default(0);
            $table->integer('new_sales')->default(0);
            $table->integer('renewals')->default(0);
            $table->integer('churn_count')->default(0);
            $table->decimal('growth_rate', 5, 2)->default(0.00);
            $table->decimal('revenue', 15, 2)->default(0.00);
            $table->decimal('average_revenue', 15, 2)->default(0.00);
            
            $table->timestamps();
            
            $table->index(['partner_id', 'package_name', 'metric_date'], 'partner_pkg_metrics_idx');
        });

        Schema::create('partner_area_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->date('metric_date');
            $table->enum('period_type', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'])->default('Monthly');
            
            $table->integer('customer_count')->default(0);
            $table->integer('new_customers')->default(0);
            $table->integer('churn_count')->default(0);
            $table->decimal('growth_rate', 5, 2)->default(0.00);
            $table->decimal('bandwidth_mbps', 10, 2)->default(0.00);
            $table->decimal('revenue', 15, 2)->default(0.00);
            $table->decimal('average_revenue', 15, 2)->default(0.00);
            
            $table->timestamps();
            
            $table->index(['partner_id', 'area_id', 'zone_id', 'metric_date'], 'partner_area_metrics_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_area_metrics');
        Schema::dropIfExists('partner_package_metrics');
        Schema::dropIfExists('partner_sales_metrics');
        Schema::dropIfExists('partner_customer_metrics');
        Schema::dropIfExists('partner_campaigns');
    }
};
