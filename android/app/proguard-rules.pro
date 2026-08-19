# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keepclassmembers class com.ironsource.sdk.controller.IronSourceWebView$JSInterface {
    public *;
}
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-keep public class com.google.android.gms.ads.** {
   public *;
}
-keep class com.ironsource.adapters.** { *;
}
-keep class com.ironsource.unity.androidbridge.** { *;
}
-dontwarn com.ironsource.mediationsdk.**
-dontwarn com.ironsource.adapters.**
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ===== 난독화 매핑/스택트레이스 =====
# R8 이 SourceFile·LineNumberTable 을 지우면 mapping.txt 로도 줄 번호를 복원할 수 없다.
-keepattributes SourceFile,LineNumberTable
# 원본 파일명은 숨기되(SourceFile -> "SourceFile") 줄 번호는 유지한다.
-renamesourcefileattribute SourceFile
# 예외 원인 체인이 잘리면 크래시 분석이 불가능하다.
-keepattributes Exceptions,InnerClasses,Signature,*Annotation*
