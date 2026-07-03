<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SeguenceSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('seguence')->count() === 0) {
            DB::table('seguence')->insert(['seqNumber' => 1]);
        }
    }
}
