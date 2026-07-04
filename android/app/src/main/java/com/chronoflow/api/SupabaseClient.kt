package com.chronoflow.api

import com.chronoflow.model.Block
import com.chronoflow.model.RecurringRule
import com.chronoflow.model.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object SupabaseClient {
    private const val BASE_URL = "https://your-project.supabase.co/rest/v1"
    private const val API_KEY = "your-anon-key"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val mediaType = "application/json".toMediaType()

    private fun buildRequest(path: String, method: String = "GET", body: String? = null): Request {
        val builder = Request.Builder()
            .url("$BASE_URL/$path")
            .header("apikey", API_KEY)
            .header("Authorization", "Bearer $API_KEY")
            .header("Content-Type", "application/json")
            .header("Prefer", "return=representation")

        when (method) {
            "GET" -> builder.get()
            "DELETE" -> builder.delete()
            else -> {
                val requestBody = body?.toRequestBody(mediaType) ?: "{}".toRequestBody(mediaType)
                builder.method(method, requestBody)
            }
        }
        return builder.build()
    }

    suspend fun fetchBlocks(userId: String, since: String? = null): Result<List<Block>> = withContext(Dispatchers.IO) {
        try {
            var path = "blocks?user_id=eq.$userId&order=start_min.asc"
            if (since != null) path += "&updated_at=gt.$since"
            val request = buildRequest(path)
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: "[]"
            val arr = JSONArray(body)
            val blocks = mutableListOf<Block>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                blocks.add(Block(
                    id = obj.getString("id"),
                    date = obj.getString("date"),
                    startMin = obj.getInt("start_min"),
                    duration = obj.getInt("duration"),
                    label = obj.getString("label"),
                    category = obj.getString("category"),
                    isRecurring = obj.optBoolean("is_recurring", false),
                    parentRuleId = obj.optString("parent_rule_id", null),
                    archived = obj.optBoolean("archived", false)
                ))
            }
            Result.success(blocks)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun upsertBlocks(blocks: List<Block>): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val arr = JSONArray()
            blocks.forEach { block ->
                arr.put(JSONObject().apply {
                    put("id", block.id)
                    put("date", block.date)
                    put("start_min", block.startMin)
                    put("duration", block.duration)
                    put("label", block.label)
                    put("category", block.category)
                    put("is_recurring", block.isRecurring)
                    put("parent_rule_id", block.parentRuleId ?: JSONObject.NULL)
                    put("archived", block.archived)
                })
            }
            val request = buildRequest("blocks", "POST", arr.toString())
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Upsert failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteBlock(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val request = buildRequest("blocks?id=eq.$id", "DELETE")
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Delete failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun archiveBlock(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = """{"archived": true}"""
            val request = buildRequest("blocks?id=eq.$id", "PATCH", body)
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Archive failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun restoreBlock(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = """{"archived": false}"""
            val request = buildRequest("blocks?id=eq.$id", "PATCH", body)
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Restore failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchRules(userId: String): Result<List<RecurringRule>> = withContext(Dispatchers.IO) {
        try {
            val path = "recurring_rules?user_id=eq.$userId&order=start_min.asc"
            val request = buildRequest(path)
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: "[]"
            val arr = JSONArray(body)
            val rules = mutableListOf<RecurringRule>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val daysArr = obj.getJSONArray("days_of_week")
                val days = mutableListOf<Int>()
                for (j in 0 until daysArr.length()) days.add(daysArr.getInt(j))
                rules.add(RecurringRule(
                    id = obj.getString("id"),
                    daysOfWeek = days,
                    startMin = obj.getInt("start_min"),
                    duration = obj.getInt("duration"),
                    label = obj.getString("label"),
                    category = obj.getString("category"),
                    activeUntil = obj.optString("active_until", null)
                ))
            }
            Result.success(rules)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addRule(rule: RecurringRule): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("id", rule.id)
                put("days_of_week", JSONArray(rule.daysOfWeek))
                put("start_min", rule.startMin)
                put("duration", rule.duration)
                put("label", rule.label)
                put("category", rule.category)
                put("active_until", rule.activeUntil ?: JSONObject.NULL)
            }.toString()
            val request = buildRequest("recurring_rules", "POST", body)
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Add rule failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateRule(rule: RecurringRule): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("days_of_week", JSONArray(rule.daysOfWeek))
                put("start_min", rule.startMin)
                put("duration", rule.duration)
                put("label", rule.label)
                put("category", rule.category)
                put("active_until", rule.activeUntil ?: JSONObject.NULL)
            }.toString()
            val request = buildRequest("recurring_rules?id=eq.${rule.id}", "PATCH", body)
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Update rule failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteRule(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val request = buildRequest("recurring_rules?id=eq.$id", "DELETE")
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Delete rule failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchSettings(userId: String): Result<Settings> = withContext(Dispatchers.IO) {
        try {
            val path = "settings?user_id=eq.$userId"
            val request = buildRequest(path)
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: "[]"
            val arr = JSONArray(body)
            if (arr.length() == 0) return@withContext Result.success(Settings())
            val obj = arr.getJSONObject(0)
            Result.success(Settings(
                sleepStart = obj.optInt("sleep_start", 1380),
                sleepEnd = obj.optInt("sleep_end", 420),
                theme = obj.optString("theme", "system"),
                timezone = obj.optString("timezone", "UTC")
            ))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun upsertSettings(settings: Settings): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("sleep_start", settings.sleepStart)
                put("sleep_end", settings.sleepEnd)
                put("theme", settings.theme)
                put("timezone", settings.timezone)
            }.toString()
            val request = buildRequest("settings", "POST", body)
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) throw Exception("Upsert settings failed: ${response.code}")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
