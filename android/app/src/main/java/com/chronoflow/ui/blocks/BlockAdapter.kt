package com.chronoflow.ui.blocks

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.chronoflow.R
import com.chronoflow.model.Block

class BlockAdapter(
    private var blocks: List<Block>,
    private val onBlockClick: ((Block) -> Unit)? = null
) : RecyclerView.Adapter<BlockAdapter.BlockViewHolder>() {

    private val categoryColors = mapOf(
        "work" to Color.rgb(66, 133, 244),
        "sleep" to Color.rgb(52, 168, 83),
        "exercise" to Color.rgb(251, 188, 4),
        "leisure" to Color.rgb(234, 67, 53),
        "meal" to Color.rgb(154, 95, 210)
    )

    fun submitList(newBlocks: List<Block>) {
        blocks = newBlocks
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BlockViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_block, parent, false)
        return BlockViewHolder(view)
    }

    override fun onBindViewHolder(holder: BlockViewHolder, position: Int) {
        val block = blocks[position]
        holder.bind(block)
    }

    override fun getItemCount(): Int = blocks.size

    inner class BlockViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val colorStrip: View = itemView.findViewById(R.id.block_color_strip)
        private val labelText: TextView = itemView.findViewById(R.id.block_label)
        private val timeText: TextView = itemView.findViewById(R.id.block_time)
        private val categoryBadge: TextView = itemView.findViewById(R.id.block_category_badge)

        fun bind(block: Block) {
            val color = categoryColors[block.category] ?: Color.GRAY
            colorStrip.setBackgroundColor(color)

            labelText.text = block.label

            val startHour = block.startMin / 60
            val startMin = block.startMin % 60
            val endMin = block.startMin + block.duration
            val endHour = endMin / 60
            val endMinute = endMin % 60
            timeText.text = String.format(
                "%02d:%02d - %02d:%02d",
                startHour, startMin, endHour, endMinute
            )

            categoryBadge.text = block.category
            categoryBadge.setTextColor(color)

            itemView.setOnClickListener { onBlockClick?.invoke(block) }
        }
    }
}
