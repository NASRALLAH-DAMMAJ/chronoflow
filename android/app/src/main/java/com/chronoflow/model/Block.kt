package com.chronoflow.model

data class Block(
    val id: String,
    val date: String,
    val startMin: Int,
    val duration: Int,
    val label: String,
    val category: String,
    val isRecurring: Boolean = false,
    val parentRuleId: String? = null,
    val archived: Boolean = false
)
