<?php

namespace App\Providers;

use App\Services\Ai\AnthropicDefectSummaryGenerator;
use App\Services\Ai\DefectSummaryGenerator;
use App\Services\Ai\MockDefectSummaryGenerator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DefectSummaryGenerator::class, function () {
            $key = config('services.anthropic.key');

            return $key
                ? new AnthropicDefectSummaryGenerator($key)
                : new MockDefectSummaryGenerator();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
