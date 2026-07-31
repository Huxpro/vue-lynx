import org.gradle.api.tasks.compile.JavaCompile
import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.gradle.jvm.toolchain.JavaToolchainService
import org.jetbrains.kotlin.gradle.dsl.KotlinAndroidProjectExtension

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.kapt) apply false
}

// Enforce a shared JDK version for all Android subprojects
val targetJavaVersion = JavaLanguageVersion.of(11)
val forcedKotlinVersion = "1.8.10"

subprojects {
    val javaToolchains = extensions.findByType(JavaToolchainService::class.java)
    if (javaToolchains != null) {
        tasks.withType<JavaCompile>().configureEach {
            javaCompiler.set(
                javaToolchains.compilerFor {
                    languageVersion.set(targetJavaVersion)
                },
            )
        }
    }

    plugins.withId("org.jetbrains.kotlin.android") {
        extensions.configure<KotlinAndroidProjectExtension> {
            jvmToolchain(11)
        }
    }

    // Align Kotlin deps to avoid pulling newer Kotlin metadata with older AGP
    configurations.configureEach {
        resolutionStrategy.eachDependency {
            if (requested.group == "org.jetbrains.kotlin") {
                useVersion(forcedKotlinVersion)
                because("Keep Kotlin libs aligned with Kotlin plugin/AGP")
            }
        }
    }
}
