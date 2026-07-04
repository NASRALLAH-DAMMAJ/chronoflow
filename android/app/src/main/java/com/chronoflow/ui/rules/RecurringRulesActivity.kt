package com.chronoflow.ui.rules

import android.os.Bundle
import android.widget.Button
import android.widget.ListView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.chronoflow.R
import com.chronoflow.db.DatabaseHelper
import com.chronoflow.db.RuleDao
import com.chronoflow.model.RecurringRule
import java.util.UUID

class RecurringRulesActivity : AppCompatActivity() {

    private lateinit var ruleDao: RuleDao
    private lateinit var rulesListView: ListView
    private val rules = mutableListOf<RecurringRule>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_recurring_rules)

        val dbHelper = DatabaseHelper(this)
        ruleDao = RuleDao(dbHelper.writableDatabase)

        rulesListView = findViewById(R.id.rules_list)
        findViewById<Button>(R.id.add_rule_button).setOnClickListener { showAddRuleDialog() }

        loadRules()
    }

    private fun loadRules() {
        rules.clear()
        rules.addAll(ruleDao.queryAll())
        // TODO: set adapter on rulesListView
    }

    private fun showAddRuleDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle(R.string.add_rule)
        // TODO: build dialog with day picker, time picker, label, category
        builder.setPositiveButton(R.string.save) { _, _ ->
            val rule = RecurringRule(
                id = UUID.randomUUID().toString(),
                daysOfWeek = listOf(),
                startMin = 480,
                duration = 60,
                label = "New Block",
                category = "work"
            )
            ruleDao.insert(rule)
            loadRules()
        }
        builder.setNegativeButton(R.string.cancel, null)
        builder.show()
    }
}
