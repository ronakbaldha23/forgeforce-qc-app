<?php

namespace Database\Seeders;

use App\Models\InspectionTemplate;
use App\Models\Machine;
use App\Models\MachineType;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with demo users, one machine type/machine,
     * and the reusable checklist template described in the ForgeForce QC brief.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Erin Engineer',
            'email' => 'engineer@forgeforce.test',
            'role' => 'engineer',
        ]);

        User::factory()->create([
            'name' => 'Quinn Manager',
            'email' => 'manager@forgeforce.test',
            'role' => 'quality_manager',
        ]);

        User::factory()->create([
            'name' => 'Alex Admin',
            'email' => 'admin@forgeforce.test',
            'role' => 'admin',
        ]);

        $machineType = MachineType::create([
            'name' => 'Hydraulic Press',
        ]);

        Machine::create([
            'machine_type_id' => $machineType->id,
            'code' => 'FF-HP-100',
            'serial_number' => 'FF100-2026-001',
            'name' => 'Hydraulic Press FF-HP-100',
            'location' => 'Shop Floor A',
        ]);

        $template = InspectionTemplate::create([
            'machine_type_id' => $machineType->id,
            'name' => 'Hydraulic Press Standard Checklist',
            'version' => 1,
            'is_active' => true,
        ]);

        $items = [
            'Hydraulic pressure test',
            'Hydraulic oil leakage',
            'Cylinder condition',
            'Safety guard',
            'Emergency stop',
            'Electrical/control panel',
        ];

        foreach ($items as $index => $label) {
            $template->items()->create([
                'label' => $label,
                'sort_order' => $index,
            ]);
        }
    }
}
