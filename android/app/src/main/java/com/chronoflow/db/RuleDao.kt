package com.chronoflow.db

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.chronoflow.model.RecurringRule

class RuleDao(private val db: SQLiteDatabase) {

    fun insert(rule: RecurringRule): Long {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_RULE_ID, rule.id)
            put(DatabaseHelper.COL_RULE_DAYS_OF_WEEK, rule.daysOfWeek.joinToString(","))
            put(DatabaseHelper.COL_RULE_START_MIN, rule.startMin)
            put(DatabaseHelper.COL_RULE_DURATION, rule.duration)
            put(DatabaseHelper.COL_RULE_LABEL, rule.label)
            put(DatabaseHelper.COL_RULE_CATEGORY, rule.category)
            put(DatabaseHelper.COL_RULE_ACTIVE_UNTIL, rule.activeUntil)
        }
        return db.insertWithOnConflict(
            DatabaseHelper.TABLE_RULES, null, values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun update(rule: RecurringRule): Int {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_RULE_DAYS_OF_WEEK, rule.daysOfWeek.joinToString(","))
            put(DatabaseHelper.COL_RULE_START_MIN, rule.startMin)
            put(DatabaseHelper.COL_RULE_DURATION, rule.duration)
            put(DatabaseHelper.COL_RULE_LABEL, rule.label)
            put(DatabaseHelper.COL_RULE_CATEGORY, rule.category)
            put(DatabaseHelper.COL_RULE_ACTIVE_UNTIL, rule.activeUntil)
        }
        return db.update(
            DatabaseHelper.TABLE_RULES, values,
            "${DatabaseHelper.COL_RULE_ID} = ?",
            arrayOf(rule.id)
        )
    }

    fun delete(id: String): Int {
        return db.delete(
            DatabaseHelper.TABLE_RULES,
            "${DatabaseHelper.COL_RULE_ID} = ?",
            arrayOf(id)
        )
    }

    fun queryAll(): List<RecurringRule> {
        val cursor = db.query(
            DatabaseHelper.TABLE_RULES, null,
            null, null, null, null,
            "${DatabaseHelper.COL_RULE_START_MIN} ASC"
        )
        return cursorToRules(cursor)
    }

    fun queryById(id: String): RecurringRule? {
        val cursor = db.query(
            DatabaseHelper.TABLE_RULES, null,
            "${DatabaseHelper.COL_RULE_ID} = ?",
            arrayOf(id), null, null, null
        )
        return cursorToRules(cursor).firstOrNull()
    }

    fun getDirtyRules(): List<RecurringRule> {
        val cursor = db.query(
            DatabaseHelper.TABLE_RULES, null,
            "${DatabaseHelper.COL_RULE_SYNCED} = 0",
            null, null, null, null
        )
        return cursorToRules(cursor)
    }

    fun markSynced(id: String) {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_RULE_SYNCED, 1)
        }
        db.update(
            DatabaseHelper.TABLE_RULES, values,
            "${DatabaseHelper.COL_RULE_ID} = ?", arrayOf(id)
        )
    }

    private fun cursorToRules(cursor: Cursor): List<RecurringRule> {
        val rules = mutableListOf<RecurringRule>()
        cursor.use { c ->
            while (c.moveToNext()) {
                val daysStr = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_DAYS_OF_WEEK))
                rules.add(
                    RecurringRule(
                        id = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_ID)),
                        daysOfWeek = daysStr.split(",").mapNotNull { it.trim().toIntOrNull() },
                        startMin = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_START_MIN)),
                        duration = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_DURATION)),
                        label = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_LABEL)),
                        category = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_CATEGORY)),
                        activeUntil = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_RULE_ACTIVE_UNTIL))
                    )
                )
            }
        }
        return rules
    }
}
