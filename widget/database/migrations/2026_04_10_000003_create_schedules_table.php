<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_route_id')->constrained()->onDelete('cascade');
            $table->string('bus_name');
            $table->string('bus_type')->default('standard'); // standard, semi-cama, cama
            $table->integer('total_seats');
            $table->dateTime('departure_at');
            $table->dateTime('arrival_at');
            $table->decimal('price', 8, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('schedules');
    }
}
