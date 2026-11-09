package expo.modules.banklistener

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class BankListenerModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  private val store get() = CapturedStore(context)

  override fun definition() = ModuleDefinition {
    Name("BankListener")

    Events("onCaptured")

    OnCreate { instance = this@BankListenerModule }
    OnDestroy { if (instance === this@BankListenerModule) instance = null }

    /** true si el usuario ha dado a Cuadra acceso a las notificaciones en Ajustes de Android. */
    Function("hasPermission") {
      val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty()
      val me = ComponentName(context, BankNotificationService::class.java)
      flat.split(":").mapNotNull { ComponentName.unflattenFromString(it) }.any { it == me }
    }

    Function("openPermissionSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("configure") { enabled: Boolean, packages: List<String>?, anyApp: Boolean ->
      store.enabled = enabled
      store.anyApp = anyApp
      if (packages != null && packages.isNotEmpty()) store.packages = packages.toSet()
    }

    Function("getDefaultPackages") { CapturedStore.DEFAULT_PACKAGES.toList() }

    Function("getPending") { store.all().map { it.toMap() } }

    Function("removePending") { ids: List<String> -> store.remove(ids) }
  }

  fun emitCaptured(item: JSONObject) {
    sendEvent("onCaptured", Bundle().apply {
      putString("id", item.getString("id"))
      putString("package", item.getString("package"))
      putString("title", item.getString("title"))
      putString("text", item.getString("text"))
      putDouble("time", item.getLong("time").toDouble())
    })
  }

  companion object {
    @Volatile var instance: BankListenerModule? = null
  }
}

private fun JSONObject.toMap(): Map<String, Any?> = mapOf(
  "id" to getString("id"),
  "package" to getString("package"),
  "title" to getString("title"),
  "text" to getString("text"),
  "time" to getLong("time").toDouble(),
)
