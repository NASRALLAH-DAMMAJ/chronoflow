package com.chronoflow.db

import android.content.ContentValues
import android.database.sqlite.SQLiteDatabase
import com.chronoflow.model.Settings

class SettingsDao(private val db: SQLiteDatabase) {

    fun read(): Settings {
        val cursor = db.query(
            DatabaseHelper.TABLE_SETTINGS, null,
            "${DatabaseHelper.COL_SETTINGS_ID} = 1",
            null, null, null, null
        )
        cursor.use { c ->
            if (c.moveToFirst()) {
                return Settings(
                    sleepStart = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_SETTINGS_SLEEP_START)),
                    sleepEnd = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_SETTINGS_SLEEP_END)),
                    theme = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_SETTINGS_THEME)),
                    timezone = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_SETTINGS_TIMEZONE))
                )
            }
        }
        return Settings()
    }

    fun write(settings: Settings): Int {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_SETTINGS_SLEEP_START, settings.sleepStart)
            put(DatabaseHelper.COL_SETTINGS_SLEEP_END, settings.sleepEnd)
            put(DatabaseHelper.COL_SETTINGS_THEME, settings.theme)
            put(DatabaseHelper.COL_SETTINGS_TIMEZONE, settings.timezone)
        }
        return db.update(
            DatabaseHelper.TABLE_SETTINGS, values,
            "${DatabaseHelper.COL_SETTINGS_ID} = 1", null
        )
    }

    fun markDirty() {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_SETTINGS_SYNCED, 0)
        }
        db.update(
            DatabaseHelper.TABLE_SETTINGS, values,
            "${DatabaseHelper.COL_SETTINGS_ID} = 1", null
        )
    }

    fun markSynced() {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_SETTINGS_SYNCED, 1)
        }
        db.update(
            DatabaseHelper.TABLE_SETTINGS, values,
            "${DatabaseHelper.COL_SETTINGS_ID} = 1", null
        )
    }

    fun isDirty(): Boolean {
        val cursor = db.rawQuery(
            "SELECT ${DatabaseHelper.COL_SETTINGS_SYNCED} FROM ${DatabaseHelper.TABLE_SETTINGS} WHERE ${DatabaseHelper.COL_SETTINGS_ID} = 1",
            null
        )
        cursor.use { c ->
            return c.moveToFirst() && c.getInt(0) == 0
        }
    }
}
