<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Partner business models (1:N) — Bandwidth Sales / Commission Based /
 * End Device Based / Support Center.
 * ERD: partner_business_models.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_models', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique()->comment('Bandwidth Sales/Commission Based/End Device Based/Support Center');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('partner_business_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_model_id')->constrained()->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamp('assigned_at')->useCurrent();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['partner_id', 'business_model_id'], 'uk_partner_model');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_business_models');
        Schema::dropIfExists('business_models');
    }
};
