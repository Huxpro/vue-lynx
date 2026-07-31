# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# LYNX START
# use @Keep to annotate retained classes.
-dontwarn android.support.annotation.Keep
-keep @android.support.annotation.Keep class **
-keep @android.support.annotation.Keep class ** {
    @android.support.annotation.Keep <fields>;
    @android.support.annotation.Keep <methods>;
}
-dontwarn androidx.annotation.Keep
-keep @androidx.annotation.Keep class **
-keep @androidx.annotation.Keep class ** {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}

# native method call
-keepclasseswithmembers,includedescriptorclasses class * {
    native <methods>;
}
-keepclasseswithmembers class * {
    @com.lynx.tasm.base.CalledByNative <methods>;
}

# to customize a module, you need to keep the class name and the method annotated as LynxMethod.
-keepclasseswithmembers class * {
    @com.lynx.jsbridge.LynxMethod <methods>;
}

-keepclassmembers class *  {
    @com.lynx.tasm.behavior.LynxProp <methods>;
    @com.lynx.tasm.behavior.LynxPropGroup <methods>;
    @com.lynx.tasm.behavior.LynxUIMethod <methods>;
}

-keepclassmembers class com.lynx.tasm.behavior.ui.UIGroup {
    public boolean needCustomLayout();
}

# in case R8 compiler may remove mLoader in bytecode.
# as mLoader is not used in java and passed as a WeakRef in JNI.
-keepclassmembers class com.lynx.tasm.LynxTemplateRender {
    private com.lynx.tasm.core.LynxResourceLoader mLoader;
}

# the automatically generated setter classes use the class names of LynxBaseUI and ShadowNode and their subclasses.
-keep class com.lynx.tasm.behavior.ui.LynxBaseUI
-keep class com.lynx.tasm.behavior.shadow.ShadowNode
-keep class com.lynx.jsbridge.LynxModule { *; }
-keep class * extends com.lynx.tasm.behavior.ui.LynxBaseUI
-keep class * extends com.lynx.tasm.behavior.shadow.ShadowNode
-keep class * extends com.lynx.jsbridge.LynxModule { *; }
-keep class * extends com.lynx.jsbridge.LynxContextModule
-keep class * implements com.lynx.tasm.behavior.utils.Settable
-keep class * implements com.lynx.tasm.behavior.utils.LynxUISetter
-keep class * implements com.lynx.tasm.behavior.utils.LynxUIMethodInvoker
-keep class com.lynx.tasm.rendernode.compat.**{
    *;
}
-keep class com.lynx.tasm.rendernode.compat.RenderNodeFactory{
    *;
}
# LYNX END