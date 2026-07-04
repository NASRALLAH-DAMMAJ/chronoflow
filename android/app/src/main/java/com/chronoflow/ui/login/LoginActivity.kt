package com.chronoflow.ui.login

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.chronoflow.R
import com.chronoflow.ui.MainActivity

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val emailInput = findViewById<EditText>(R.id.login_email)
        val passwordInput = findViewById<EditText>(R.id.login_password)
        val loginButton = findViewById<Button>(R.id.login_button)
        val signupButton = findViewById<Button>(R.id.signup_button)

        loginButton.setOnClickListener {
            val email = emailInput.text.toString()
            val password = passwordInput.text.toString()
            // TODO: authenticate with Supabase
            if (email.isNotBlank() && password.isNotBlank()) {
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            } else {
                Toast.makeText(this, R.string.login_invalid, Toast.LENGTH_SHORT).show()
            }
        }

        signupButton.setOnClickListener {
            // TODO: navigate to signup flow
            Toast.makeText(this, R.string.signup_not_implemented, Toast.LENGTH_SHORT).show()
        }
    }
}
