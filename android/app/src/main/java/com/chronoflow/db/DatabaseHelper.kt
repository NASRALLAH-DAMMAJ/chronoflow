package com.chronoflow.db

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DatabaseHelper(context: Context) : SQLiteOpenHelper(
    context, DATABASE_NAME, null, DATABASE_VERSION
) {
    companion object {
        const val DATABASE_NAME = "chronoflow.db"
        const val DATABASE_VERSION = 1

        const val TABLE_BLOCKS = "blocks"
        const val COL_BLOCK_ID = "id"
        const val COL_BLOCK_DATE = "date"
        const val COL_BLOCK_START_MIN = "start_min"
        const val COL_BLOCK_DURATION = "duration"
        const val COL_BLOCK_LABEL = "label"
        const val COL_BLOCK_CATEGORY = "category"
        const val COL_BLOCK_IS_RECURRING = "is_recurring"
        const val COL_BLOCK_PARENT_RULE_ID = "parent_rule_id"
        const val COL_BLOCK_ARCHIVED = "archived"
        const val COL_BLOCK_SYNCED = "synced"
        const val COL_BLOCK_UPDATED_AT = "updated_at"

        const val TABLE_RULES = "recurring_rules"
        const val COL_RULE_ID = "id"
        const val COL_RULE_DAYS_OF_WEEK = "days_of_week"
        const val COL_RULE_START_MIN = "start_min"
        const val COL_RULE_DURATION = "duration"
        const val COL_RULE_LABEL = "label"
        const val COL_RULE_CATEGORY = "category"
        const val COL_RULE_ACTIVE_UNTIL = "active_until"
        const val COL_RULE_SYNCED = "synced"
        const val COL_RULE_UPDATED_AT = "updated_at"

        const val TABLE_SETTINGS = "settings"
        const val COL_SETTINGS_ID = "id"
        const val COL_SETTINGS_SLEEP_START = "sleep_start"
        const val COL_SETTINGS_SLEEP_END = "sleep_end"
        const val COL_SETTINGS_THEME = "theme"
        const val COL_SETTINGS_TIMEZONE = "timezone"
        const val COL_SETTINGS_SYNCED = "synced"
        const val COL_SETTINGS_UPDATED_AT = "updated_at"
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE $TABLE_BLOCKS (
                $COL_BLOCK_ID TEXT PRIMARY KEY,
                $COL_BLOCK_DATE TEXT NOT NULL,
                $COL_BLOCK_START_MIN INTEGER NOT NULL,
                $COL_BLOCK_DURATION INTEGER NOT NULL,
                $COL_BLOCK_LABEL TEXT NOT NULL,
                $COL_BLOCK_CATEGORY TEXT NOT NULL,
                $COL_BLOCK_IS_RECURRING INTEGER NOT NULL DEFAULT 0,
                $COL_BLOCK_PARENT_RULE_ID TEXT,
                $COL_BLOCK_ARCHIVED INTEGER NOT NULL DEFAULT 0,
                $COL_BLOCK_SYNCED INTEGER NOT NULL DEFAULT 1,
                $COL_BLOCK_UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        db.execSQL("""
            CREATE TABLE $TABLE_RULES (
                $COL_RULE_ID TEXT PRIMARY KEY,
                $COL_RULE_DAYS_OF_WEEK TEXT NOT NULL,
                $COL_RULE_START_MIN INTEGER NOT NULL,
                $COL_RULE_DURATION INTEGER NOT NULL,
                $COL_RULE_LABEL TEXT NOT NULL,
                $COL_RULE_CATEGORY TEXT NOT NULL,
                $COL_RULE_ACTIVE_UNTIL TEXT,
                $COL_RULE_SYNCED INTEGER NOT NULL DEFAULT 1,
                $COL_RULE_UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        db.execSQL("""
            CREATE TABLE $TABLE_SETTINGS (
                $COL_SETTINGS_ID INTEGER PRIMARY KEY DEFAULT 1,
                $COL_SETTINGS_SLEEP_START INTEGER NOT NULL DEFAULT 1380,
                $COL_SETTINGS_SLEEP_END INTEGER NOT NULL DEFAULT 420,
                $COL_SETTINGS_THEME TEXT NOT NULL DEFAULT 'system',
                $COL_SETTINGS_TIMEZONE TEXT NOT NULL DEFAULT 'UTC',
                $COL_SETTINGS_SYNCED INTEGER NOT NULL DEFAULT 1,
                $COL_SETTINGS_UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)

        db.execSQL("INSERT OR IGNORE INTO $TABLE_SETTINGS ($COL_SETTINGS_ID) VALUES (1)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_BLOCKS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_RULES")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SETTINGS")
        onCreate(db)
    }
}
