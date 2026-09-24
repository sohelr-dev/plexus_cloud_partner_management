<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Support Center module tables (ERD):
 * support_centers, support_center_users, support_center_assignments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_centers', function (Blueprint $table) {
            $table->id();
            $table->string('center_name', 255);
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('zone_id')->nullable()
                ->constrained('zones')->nullOnDelete();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('center_type', 50)->nullable()
                ->comment('Main/Sub/Franchise/Agent');
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Inactive/Suspended');
            $table->time('opening_hours')->nullable();
            $table->time('closing_hours')->nullable();
            $table->unsignedTinyInteger('day_off')->nullable()
                ->comment('0=Sunday ... 6=Saturday, NULL=7 days');
            $table->unsignedInteger('capacity')->nullable()
                ->comment('Max concurrent tickets/service capacity');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('support_center_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 50)->default('Staff')->index()
                ->comment('Manager/Supervisor/Staff/Agent');
            $table->boolean('is_primary')->default(false);
            $table->string('status', 50)->default('Active')->index();
            $table->timestamps();
            $table->unique(['support_center_id', 'user_id']);
        });

        Schema::create('support_center_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_center_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->index()
                ->comment('Assigned customer / client record');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_center_assignments');
        Schema::dropIfExists('support_center_users');
        Schema::dropIfExists('support_centers');
    }
};
