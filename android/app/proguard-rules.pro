# ─── React Native core ────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# ─── App package ──────────────────────────────────────────────────────────────
-keep class com.vilvom_app.** { *; }

# ─── Native methods ───────────────────────────────────────────────────────────
-keepclassmembers class * {
    native <methods>;
}

# ─── OkHttp (used for all API calls) ──────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ─── React Navigation ─────────────────────────────────────────────────────────
-keep class com.swmansion.** { *; }
-dontwarn com.swmansion.**

# ─── react-native-screens ─────────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ─── react-native-safe-area-context ───────────────────────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ─── react-native-push-notification / local notifications ────────────────────
-keep class com.dieam.reactnativepushnotification.** { *; }
-dontwarn com.dieam.reactnativepushnotification.**

# ─── react-native-vector-icons ────────────────────────────────────────────────
-keep class com.oblador.vectoricons.** { *; }

# ─── react-native-image-picker / camera ───────────────────────────────────────
-keep class com.imagepicker.** { *; }

# ─── react-native-voice ───────────────────────────────────────────────────────
-keep class com.wenkesj.voice.** { *; }

# ─── react-native-video ───────────────────────────────────────────────────────
-keep class com.brentvatne.** { *; }
-dontwarn com.brentvatne.**

# ─── AsyncStorage ─────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── Serialization — keep classes used with JSON parsing ──────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ─── JavaScript interface bridges (JSI) ───────────────────────────────────────
-keep class com.facebook.react.turbomodule.** { *; }

# ─── Suppress common warnings from RN dependencies ────────────────────────────
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
