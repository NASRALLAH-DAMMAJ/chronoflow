package com.chronoflow.model

data class RecurringRule(
    val id: String,
    val daysOfWeek: List<Int>,
    val startMin: Int,
    val duration: Int,
    val label: String,
    val category: String,
    val activeUntil: String? = null
)
