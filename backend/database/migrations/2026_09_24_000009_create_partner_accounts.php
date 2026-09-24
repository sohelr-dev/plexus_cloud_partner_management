<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Partner Accounts module tables (ERD):
 * partner_accounts, partner_account_transactions.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('account_number', 50)->unique();
            $table->string('account_type', 50)->default('Main')->index()
                ->comment('Main/Security/Commission/Escrow');
            $table->decimal('balance', 15, 2)->default(0)
                ->comment('Current account balance');
            $table->decimal('security_deposit', 15, 2)->default(0);
            $table->decimal('pending_payout', 15, 2)->default(0);
            $table->string('currency', 3)->default('BDT');
            $table->string('status', 50)->default('Active')->index()
                ->comment('Active/Frozen/Closed');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['partner_id', 'account_type']);
        });

        Schema::create('partner_account_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_account_id')->constrained()->cascadeOnDelete();
            $table->string('trx_number', 50)->unique();
            $table->enum('type', ['Deposit', 'Withdrawal', 'Adjustment', 'Commission', 'Payout', 'Refund'])->index();
            $table->enum('direction', ['Credit', 'Debit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('reference_type', 50)->nullable()->index()
                ->comment('Morph ref: commission/bandwidth/invoice');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('payment_method', 50)->nullable()
                ->comment('bKash/Nagad/Bank/Cash/Cheque');
            $table->string('status', 50)->default('Completed')->index()
                ->comment('Pending/Completed/Failed/Reversed');
            $table->text('description')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_account_transactions');
        Schema::dropIfExists('partner_accounts');
    }
};
