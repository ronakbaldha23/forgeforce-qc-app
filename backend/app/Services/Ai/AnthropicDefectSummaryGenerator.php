<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * REAL implementation — calls the Anthropic Messages API. Only used when
 * services.anthropic.key is set (see AppServiceProvider::register()); otherwise
 * MockDefectSummaryGenerator is bound instead.
 */
class AnthropicDefectSummaryGenerator implements DefectSummaryGenerator
{
    public function __construct(private string $apiKey) {}

    public function summarize(array $findings): string
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => 'claude-3-5-haiku-latest',
            'max_tokens' => 400,
            'messages' => [[
                'role' => 'user',
                'content' => $this->buildPrompt($findings),
            ]],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Anthropic API request failed: '.$response->body());
        }

        return trim($response->json('content.0.text') ?? '');
    }

    private function buildPrompt(array $findings): string
    {
        $json = json_encode($findings, JSON_PRETTY_PRINT);

        return <<<PROMPT
            You are assisting a quality control engineer. Below is structured JSON
            describing the failed checklist items from one machine inspection,
            including any recorded defects. Write a concise (3-6 sentence) plain-text
            summary of the findings suitable for a QC report. Do not invent details
            not present in the data. Do not include a preamble or sign-off.

            {$json}
            PROMPT;
    }
}
