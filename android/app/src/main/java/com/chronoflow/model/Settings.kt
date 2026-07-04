package com.chronoflow.model

data class Settings(
    val sleepStart: Int = 1380,
    val sleepEnd: Int = 420,
    val theme: String = "system",
    val timezone: String = "UTC"
)
