package com.chronoflow.ui.analytics

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.chronoflow.R
import com.chronoflow.db.BlockDao
import com.chronoflow.db.DatabaseHelper

class AnalyticsActivity : AppCompatActivity() {

    private lateinit var blockDao: BlockDao

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_analytics)

        val dbHelper = DatabaseHelper(this)
        blockDao = BlockDao(dbHelper.writableDatabase)

        val totalTimeTodayView = findViewById<TextView>(R.id.total_time_today)
        // TODO: compute and display stats
    }
}
