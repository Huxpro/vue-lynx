package com.example.sparkling.go

data class SparklingAutolinkModule(val name: String, val androidPackage: String?, val className: String?)

object SparklingAutolink {
    val modules = listOf(
        SparklingAutolinkModule(name = "sparkling-navigation", androidPackage = "com.tiktok.sparkling.methods.router", className = "RouterMethod")
    )
}
