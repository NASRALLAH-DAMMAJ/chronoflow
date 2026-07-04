package com.chronoflow.sync

import android.content.Context
import com.chronoflow.api.SupabaseClient
import com.chronoflow.db.BlockDao
import com.chronoflow.db.DatabaseHelper
import com.chronoflow.db.RuleDao
import com.chronoflow.db.SettingsDao

class SyncManager(private val context: Context) {

    private val dbHelper = DatabaseHelper(context)
    private val blockDao = BlockDao(dbHelper.writableDatabase)
    private val ruleDao = RuleDao(dbHelper.writableDatabase)
    private val settingsDao = SettingsDao(dbHelper.writableDatabase)

    suspend fun syncAll(): Result<Unit> {
        return try {
            syncDirtyBlocks()
            syncDirtyRules()
            syncDirtySettings()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun syncDirtyBlocks() {
        val dirtyBlocks = blockDao.getDirtyBlocks()
        if (dirtyBlocks.isEmpty()) return

        val result = SupabaseClient.upsertBlocks(dirtyBlocks)
        if (result.isSuccess) {
            dirtyBlocks.forEach { blockDao.markSynced(it.id) }
        }
    }

    private suspend fun syncDirtyRules() {
        val dirtyRules = ruleDao.getDirtyRules()
        if (dirtyRules.isEmpty()) return

        dirtyRules.forEach { rule ->
            val result = SupabaseClient.addRule(rule)
            if (result.isSuccess) {
                ruleDao.markSynced(rule.id)
            }
        }
    }

    private suspend fun syncDirtySettings() {
        if (!settingsDao.isDirty()) return
        val settings = settingsDao.read()
        val result = SupabaseClient.upsertSettings(settings)
        if (result.isSuccess) {
            settingsDao.markSynced()
        }
    }

    suspend fun fetchRemoteData(userId: String) {
        val blocksResult = SupabaseClient.fetchBlocks(userId)
        if (blocksResult.isSuccess) {
            blocksResult.getOrThrow().forEach { blockDao.insert(it) }
        }

        val rulesResult = SupabaseClient.fetchRules(userId)
        if (rulesResult.isSuccess) {
            rulesResult.getOrThrow().forEach { ruleDao.insert(it) }
        }

        val settingsResult = SupabaseClient.fetchSettings(userId)
        if (settingsResult.isSuccess) {
            settingsResult.getOrThrow().let { settingsDao.write(it) }
        }
    }
}
