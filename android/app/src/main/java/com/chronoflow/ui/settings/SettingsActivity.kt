package com.chronoflow.ui.settings

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.SeekBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.chronoflow.R
import com.chronoflow.db.DatabaseHelper
import com.chronoflow.db.SettingsDao
import com.chronoflow.model.Settings

class SettingsActivity : AppCompatActivity() {

    private lateinit var settingsDao: SettingsDao
    private lateinit var sleepStartSeekBar: SeekBar
    private lateinit var sleepEndSeekBar: SeekBar
    private lateinit var sleepStartLabel: TextView
    private lateinit var sleepEndLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val dbHelper = DatabaseHelper(this)
        settingsDao = SettingsDao(dbHelper.writableDatabase)

        sleepStartSeekBar = findViewById(R.id.sleep_start_seekbar)
        sleepEndSeekBar = findViewById(R.id.sleep_end_seekbar)
        sleepStartLabel = findViewById(R.id.sleep_start_label)
        sleepEndLabel = findViewById(R.id.sleep_end_label)

        val saveButton = findViewById<Button>(R.id.save_settings_button)

        val settings = settingsDao.read()
        sleepStartSeekBar.progress = settings.sleepStart
        sleepEndSeekBar.progress = settings.sleepEnd
        updateSleepLabels(settings.sleepStart, settings.sleepEnd)

        sleepStartSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateSleepLabels(progress, sleepEndSeekBar.progress)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        sleepEndSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                updateSleepLabels(sleepStartSeekBar.progress, progress)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        saveButton.setOnClickListener {
            val updated = Settings(
                sleepStart = sleepStartSeekBar.progress,
                sleepEnd = sleepEndSeekBar.progress,
                theme = settings.theme,
                timezone = settings.timezone
            )
            settingsDao.write(updated)
            settingsDao.markDirty()
            finish()
        }
    }

    private fun updateSleepLabels(sleepStart: Int, sleepEnd: Int) {
        sleepStartLabel.text = getString(R.string.sleep_start_format, sleepStart / 60, sleepStart % 60)
        sleepEndLabel.text = getString(R.string.sleep_end_format, sleepEnd / 60, sleepEnd % 60)
    }
}
