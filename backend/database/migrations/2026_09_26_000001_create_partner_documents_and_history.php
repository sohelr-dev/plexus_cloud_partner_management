<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_id', 50)->unique()
                ->comment('DOC-000101 format — generated on boot');
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

            $table->string('document_name', 255);
            $table->string('category', 50)->index()
                ->comment('Legal/Financial/Network/Support Center');
            $table->string('document_type', 100)->index()
                ->comment('Partner Agreement/Contract/Amendment/Trade License/Invoice/... (Section 69)');

            // Optional scope link — a document can belong to a Support Center branch
            $table->foreignId('support_center_id')->nullable()
                ->constrained('partner_support_centers')->nullOnDelete();

            $table->string('version', 20)->default('1.0')
                ->comment('Current version label — history in partner_document_versions');
            $table->string('status', 50)->default('Draft')->index()
                ->comment('Draft/Pending Approval/Active/Expired/Rejected/Archived');

            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable()->index();

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->string('file_path', 500)->nullable();
            $table->string('file_name', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable()->comment('bytes');

            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['partner_id', 'category']);
            $table->index(['partner_id', 'status']);
        });

        Schema::create('partner_document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('partner_documents')->cascadeOnDelete();
            $table->string('version', 20)->comment('1.0 / 1.1 / 2.0');
            $table->boolean('is_current')->default(false)->index();

            $table->string('file_path', 500);
            $table->string('file_name', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('change_notes')->nullable()->comment('Why this version was created');
            $table->timestamps();
        });

        Schema::create('partner_document_expiry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('partner_documents')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('alert_days')->comment('90/60/30/15/7/0 (0 = already expired)');
            $table->date('expiry_date');
            $table->date('alert_date')->comment('expiry_date - alert_days');
            $table->string('level', 20)->comment('Info/Warning/Critical/Expired');

            $table->boolean('acknowledged')->default(false)->index();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique(['document_id', 'alert_days'], 'doc_expiry_unique');
            $table->index(['partner_id', 'acknowledged']);
        });

        Schema::create('partner_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

            $table->string('event_type', 100)->index()
                ->comment('Partner Created/Approved/Activated/Agreement Signed/Bandwidth Allocated/... (Section 73)');
            $table->string('module', 50)->index()
                ->comment('Business/Marketing/Financial/Bandwidth/Equipment/Users/Commission/Support Center/Documents/Approval/System (Section 74)');
            $table->string('title', 255);
            $table->text('description')->nullable();

            $table->string('severity', 20)->default('Info')
                ->comment('Info/Success/Warning/Danger');

            $table->string('reference_type', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_label', 255)->nullable();

            $table->json('meta')->nullable();

            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('event_date')->useCurrent()->index();
            $table->timestamps();

            $table->index(['partner_id', 'event_date']);
            $table->index(['partner_id', 'module']);
        });

        Schema::create('partner_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();

            $table->text('note');
            $table->string('category', 50)->default('General')->index()
                ->comment('Management/Sales/Finance/Network/Marketing/Support Center/General');
            $table->string('priority', 20)->default('Normal')->index()
                ->comment('Low/Normal/High/Urgent');
            $table->string('visibility', 50)->default('Internal')->index()
                ->comment('Internal/Management Only/Public to Partner');

            $table->string('attachment_path', 500)->nullable();
            $table->string('attachment_name', 255)->nullable();

            $table->boolean('is_pinned')->default(false)->index();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['partner_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_notes');
        Schema::dropIfExists('partner_timeline_events');
        Schema::dropIfExists('partner_document_expiry');
        Schema::dropIfExists('partner_document_versions');
        Schema::dropIfExists('partner_documents');
    }
};
