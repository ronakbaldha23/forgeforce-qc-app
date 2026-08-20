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
        Schema::create('ai_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('defect_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('suggestion_type', ['defect_summary', 'corrective_action']);
            $table->json('input_snapshot');
            $table->text('suggested_text');
            $table->enum('status', ['pending', 'accepted', 'edited', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->text('accepted_text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_suggestions');
    }
};
