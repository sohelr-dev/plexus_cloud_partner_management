<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * audit_logs — polymorphic, covers every entity in the system.
 * Section 93: entity (string) + entity_id (bigint), NO direct FK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Who did it
            $table->unsignedBigInteger('user_id')->nullable()->index();  // null = system/job
            $table->string('user_name', 100)->nullable();                // snapshot (user may be deleted later)

            // What action
            $table->string('action', 50);           // created|updated|deleted|restored|status_changed|approved|...

            // Which entity (polymorphic — no FK, intentional per BR-12 / §93)
            $table->string('entity_type', 100);     // e.g. "Partner", "BandwidthAllocation"
            $table->unsignedBigInteger('entity_id');
            $table->string('entity_label', 255)->nullable(); // human-readable e.g. partner_name

            // Changes
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Context
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->text('reason')->nullable();      // for approvals, reversals etc.

            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
