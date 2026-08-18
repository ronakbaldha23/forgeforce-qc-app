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
        Schema::create('inspection_item_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_item_result_id')->constrained()->cascadeOnDelete();
            $table->enum('previous_result', ['pass', 'fail', 'na'])->nullable();
            $table->enum('new_result', ['pass', 'fail', 'na']);
            $table->text('previous_comment')->nullable();
            $table->text('new_comment')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->timestamp('changed_at');
            $table->string('change_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_item_history');
    }
};
