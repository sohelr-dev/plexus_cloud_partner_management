<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Settings Table 

 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();

            $table->string('key', 100)->unique();

            $table->string('label', 150);

            $table->text('value')->nullable();

            $table->text('default_value')->nullable();

            $table->string('group', 50)->index();
            $table->string('type', 20)->default('string');
            $table->json('options')->nullable();

            $table->string('description', 500)->nullable();
            $table->boolean('is_system')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
