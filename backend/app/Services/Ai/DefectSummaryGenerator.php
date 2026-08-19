<?php

namespace App\Services\Ai;

interface DefectSummaryGenerator
{
    /**
     * @param  array  $findings  Structured inspection findings (see AiSummaryService::buildFindings()).
     * @return string A concise, human-readable summary. Advisory only — never persisted as an
     *                official record without a human explicitly accepting it.
     */
    public function summarize(array $findings): string;
}
