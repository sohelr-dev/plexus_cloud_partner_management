<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('territories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('status', 20)->default('Active');
            $table->timestamps();
        });

        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->foreignId('territory_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('Active');
            $table->timestamps();
        });

        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('Active');
            $table->timestamps();
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('package_id', 50)->unique();
            $table->string('package_name');
            $table->string('service', 50)->nullable()->comment('Internet/GGC/FNA/BDIX');
            $table->decimal('speed_mbps', 10, 2)->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->string('status', 20)->default('Active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
        Schema::dropIfExists('areas');
        Schema::dropIfExists('zones');
        Schema::dropIfExists('territories');
    }
};
