<?php

namespace App\Services\Ai;

/**
 * MOCK implementation — used whenever no AI API key is configured
 * (see AppServiceProvider::register()). Produces a deterministic, rule-based
 * summary from the same structured findings a real model would receive,
 * so swapping in a real call later is a one-class change behind the
 * DefectSummaryGenerator interface. This is clearly not a real AI call:
 * no external request is made.
 */
class MockDefectSummaryGenerator implements DefectSummaryGenerator
{
    public function summarize(array $findings): string
    {
        $machine = $findings['machine'];
        $items = $findings['failed_items'];

        if (empty($items)) {
            return "No failed checklist items were recorded for {$machine['name']} ({$machine['code']}).";
        }

        $lines = [];
        $lines[] = sprintf(
            '%s (%s, serial %s): %d checklist item(s) failed inspection.',
            $machine['name'],
            $machine['code'],
            $machine['serial_number'],
            count($items)
        );

        foreach ($items as $item) {
            $severities = array_column($item['defects'], 'severity');
            $worst = $this->worstSeverity($severities);
            $descriptor = $worst ? " ({$worst} severity)" : '';

            $detail = $item['comment'] ?: ($item['defects'][0]['description'] ?? 'No further detail recorded.');
            $lines[] = "- {$item['label']}{$descriptor}: {$detail}";
        }

        $criticalCount = count(array_filter($items, fn ($i) => $this->worstSeverity(array_column($i['defects'], 'severity')) === 'critical'));
        if ($criticalCount > 0) {
            $lines[] = "Recommend prioritizing the {$criticalCount} critical-severity item(s) before returning the machine to service.";
        }

        return implode("\n", $lines);
    }

    private function worstSeverity(array $severities): ?string
    {
        $order = ['critical', 'major', 'minor'];
        foreach ($order as $level) {
            if (in_array($level, $severities, true)) {
                return $level;
            }
        }

        return null;
    }
}
