package com.chronoflow.ui.archive

import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.chronoflow.R
import com.chronoflow.db.BlockDao
import com.chronoflow.db.DatabaseHelper
import com.chronoflow.model.Block
import com.chronoflow.ui.blocks.BlockAdapter

class ArchiveActivity : AppCompatActivity() {

    private lateinit var blockDao: BlockDao
    private lateinit var adapter: BlockAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_archive)

        val dbHelper = DatabaseHelper(this)
        blockDao = BlockDao(dbHelper.writableDatabase)

        val recyclerView = findViewById<RecyclerView>(R.id.archive_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)

        adapter = BlockAdapter(emptyList()) { block ->
            // TODO: confirm restore dialog, then update block.archived = false
        }
        recyclerView.adapter = adapter

        findViewById<Button>(R.id.clear_archive_button).setOnClickListener {
            // TODO: confirm and delete all archived blocks
        }

        loadArchived()
    }

    private fun loadArchived() {
        val archived = blockDao.queryArchived()
        adapter.submitList(archived)
    }
}
