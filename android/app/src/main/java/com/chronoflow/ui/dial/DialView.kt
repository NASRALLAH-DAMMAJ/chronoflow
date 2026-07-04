package com.chronoflow.ui.dial

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import com.chronoflow.model.Block

class DialView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    var blocks: List<Block> = emptyList()
        set(value) {
            field = value
            invalidate()
        }

    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val tickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
    }
    private val blockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val currentTimePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val cx = width / 2f
        val cy = height / 2f
        val radius = minOf(cx, cy) * 0.9f

        // TODO: draw background circle with sleep/shade regions
        // backgroundPaint.color = ...
        // canvas.drawCircle(cx, cy, radius, backgroundPaint)

        // TODO: draw hour ticks (24 ticks around the dial)
        // for each hour 0..23, compute angle and draw tick line

        // TODO: draw labels for each hour

        // TODO: draw blocks as arcs on the dial
        // for each block in blocks, compute start angle and sweep angle
        // blockPaint.color = Color.parseColor(block.category) or similar
        // canvas.drawArc(oval, startAngle, sweepAngle, true, blockPaint)

        // TODO: draw current time indicator line
        // compute angle from current time
        // canvas.drawLine(cx, cy, cx + dx, cy + dy, currentTimePaint)

        // TODO: handle clicks on blocks
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        // TODO: detect which block was tapped and invoke listener
        return super.onTouchEvent(event)
    }

    private fun timeToAngle(hour: Int, minute: Int): Float {
        val totalMinutes = hour * 60 + minute
        return (totalMinutes / 1440f) * 360f - 90f
    }
}
