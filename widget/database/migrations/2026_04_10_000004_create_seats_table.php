<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSeatsTable extends Migration
{
    public function up()
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained()->onDelete('cascade');
            $table->string('seat_number', 10);
            $table->string('deck')->default('lower'); // lower, upper
            $table->boolean('is_reserved')->default(false);
            $table->timestamps();

            $table->unique(['schedule_id', 'seat_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('seats');
    }
}
