package com.chronoflow.ui.blocks

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.chronoflow.R
import com.chronoflow.db.BlockDao
import com.chronoflow.db.DatabaseHelper
import com.chronoflow.model.Block
import java.time.LocalDate

class BlockListFragment : Fragment() {

    private lateinit var blockDao: BlockDao
    private lateinit var adapter: BlockAdapter
    private var currentDate: String = LocalDate.now().toString()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_block_list, container, false)

        val dbHelper = DatabaseHelper(requireContext())
        blockDao = BlockDao(dbHelper.writableDatabase)

        val recyclerView = view.findViewById<RecyclerView>(R.id.block_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        adapter = BlockAdapter(emptyList()) { block ->
            // TODO: open block edit dialog
        }
        recyclerView.adapter = adapter

        loadBlocks()

        return view
    }

    fun loadBlocks() {
        val blocks = blockDao.queryByDate(currentDate)
        adapter.submitList(blocks)
    }

    fun setDate(date: String) {
        currentDate = date
        loadBlocks()
    }
}
