package com.chronoflow.db

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.chronoflow.model.Block

class BlockDao(private val db: SQLiteDatabase) {

    fun insert(block: Block): Long {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_BLOCK_ID, block.id)
            put(DatabaseHelper.COL_BLOCK_DATE, block.date)
            put(DatabaseHelper.COL_BLOCK_START_MIN, block.startMin)
            put(DatabaseHelper.COL_BLOCK_DURATION, block.duration)
            put(DatabaseHelper.COL_BLOCK_LABEL, block.label)
            put(DatabaseHelper.COL_BLOCK_CATEGORY, block.category)
            put(DatabaseHelper.COL_BLOCK_IS_RECURRING, if (block.isRecurring) 1 else 0)
            put(DatabaseHelper.COL_BLOCK_PARENT_RULE_ID, block.parentRuleId)
            put(DatabaseHelper.COL_BLOCK_ARCHIVED, if (block.archived) 1 else 0)
        }
        return db.insertWithOnConflict(
            DatabaseHelper.TABLE_BLOCKS, null, values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun update(block: Block): Int {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_BLOCK_DATE, block.date)
            put(DatabaseHelper.COL_BLOCK_START_MIN, block.startMin)
            put(DatabaseHelper.COL_BLOCK_DURATION, block.duration)
            put(DatabaseHelper.COL_BLOCK_LABEL, block.label)
            put(DatabaseHelper.COL_BLOCK_CATEGORY, block.category)
            put(DatabaseHelper.COL_BLOCK_IS_RECURRING, if (block.isRecurring) 1 else 0)
            put(DatabaseHelper.COL_BLOCK_PARENT_RULE_ID, block.parentRuleId)
            put(DatabaseHelper.COL_BLOCK_ARCHIVED, if (block.archived) 1 else 0)
        }
        return db.update(
            DatabaseHelper.TABLE_BLOCKS, values,
            "${DatabaseHelper.COL_BLOCK_ID} = ?",
            arrayOf(block.id)
        )
    }

    fun delete(id: String): Int {
        return db.delete(
            DatabaseHelper.TABLE_BLOCKS,
            "${DatabaseHelper.COL_BLOCK_ID} = ?",
            arrayOf(id)
        )
    }

    fun queryByDate(date: String): List<Block> {
        val cursor = db.query(
            DatabaseHelper.TABLE_BLOCKS, null,
            "${DatabaseHelper.COL_BLOCK_DATE} = ? AND ${DatabaseHelper.COL_BLOCK_ARCHIVED} = 0",
            arrayOf(date), null, null,
            "${DatabaseHelper.COL_BLOCK_START_MIN} ASC"
        )
        return cursorToBlocks(cursor)
    }

    fun queryArchived(): List<Block> {
        val cursor = db.query(
            DatabaseHelper.TABLE_BLOCKS, null,
            "${DatabaseHelper.COL_BLOCK_ARCHIVED} = 1",
            null, null, null,
            "${DatabaseHelper.COL_BLOCK_UPDATED_AT} DESC"
        )
        return cursorToBlocks(cursor)
    }

    fun queryByParentRuleId(parentRuleId: String): List<Block> {
        val cursor = db.query(
            DatabaseHelper.TABLE_BLOCKS, null,
            "${DatabaseHelper.COL_BLOCK_PARENT_RULE_ID} = ?",
            arrayOf(parentRuleId), null, null, null
        )
        return cursorToBlocks(cursor)
    }

    fun queryAll(): List<Block> {
        val cursor = db.query(
            DatabaseHelper.TABLE_BLOCKS, null,
            null, null, null, null,
            "${DatabaseHelper.COL_BLOCK_UPDATED_AT} DESC"
        )
        return cursorToBlocks(cursor)
    }

    fun getDirtyBlocks(): List<Block> {
        val cursor = db.query(
            DatabaseHelper.TABLE_BLOCKS, null,
            "${DatabaseHelper.COL_BLOCK_SYNCED} = 0",
            null, null, null, null
        )
        return cursorToBlocks(cursor)
    }

    fun markSynced(id: String) {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_BLOCK_SYNCED, 1)
        }
        db.update(
            DatabaseHelper.TABLE_BLOCKS, values,
            "${DatabaseHelper.COL_BLOCK_ID} = ?", arrayOf(id)
        )
    }

    fun markDirty(id: String) {
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_BLOCK_SYNCED, 0)
        }
        db.update(
            DatabaseHelper.TABLE_BLOCKS, values,
            "${DatabaseHelper.COL_BLOCK_ID} = ?", arrayOf(id)
        )
    }

    private fun cursorToBlocks(cursor: Cursor): List<Block> {
        val blocks = mutableListOf<Block>()
        cursor.use { c ->
            while (c.moveToNext()) {
                blocks.add(
                    Block(
                        id = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_ID)),
                        date = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_DATE)),
                        startMin = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_START_MIN)),
                        duration = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_DURATION)),
                        label = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_LABEL)),
                        category = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_CATEGORY)),
                        isRecurring = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_IS_RECURRING)) == 1,
                        parentRuleId = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_PARENT_RULE_ID)),
                        archived = c.getInt(c.getColumnIndexOrThrow(DatabaseHelper.COL_BLOCK_ARCHIVED)) == 1
                    )
                )
            }
        }
        return blocks
    }
}
