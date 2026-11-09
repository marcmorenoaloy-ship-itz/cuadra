package expo.modules.banklistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Guarda en el móvil las notificaciones de banco capturadas hasta que la app las lea.
 * Nada sale del dispositivo.
 */
class CapturedStore(context: Context) {
  private val prefs = context.getSharedPreferences("cuadra_bank_listener", Context.MODE_PRIVATE)

  var enabled: Boolean
    get() = prefs.getBoolean("enabled", false)
    set(v) = prefs.edit().putBoolean("enabled", v).apply()

  var anyApp: Boolean
    get() = prefs.getBoolean("anyApp", false)
    set(v) = prefs.edit().putBoolean("anyApp", v).apply()

  var packages: Set<String>
    get() = prefs.getStringSet("packages", DEFAULT_PACKAGES) ?: DEFAULT_PACKAGES
    set(v) = prefs.edit().putStringSet("packages", v).apply()

  @Synchronized
  fun all(): List<JSONObject> {
    val arr = JSONArray(prefs.getString("pending", "[]"))
    return (0 until arr.length()).map { arr.getJSONObject(it) }
  }

  /** Añade una captura. Devuelve null si es un duplicado reciente (los bancos a veces repiten el aviso). */
  @Synchronized
  fun add(pkg: String, title: String, text: String, time: Long): JSONObject? {
    val items = all().toMutableList()
    val dup = items.any {
      it.getString("text") == text && it.getString("title") == title && Math.abs(it.getLong("time") - time) < 10 * 60_000
    }
    if (dup) return null
    val item = JSONObject()
      .put("id", "$time-${(text + title).hashCode()}")
      .put("package", pkg)
      .put("title", title)
      .put("text", text)
      .put("time", time)
    items.add(item)
    // Como máximo 200 pendientes, por si el usuario no abre la app en mucho tiempo.
    val trimmed = items.takeLast(200)
    prefs.edit().putString("pending", JSONArray(trimmed).toString()).apply()
    return item
  }

  @Synchronized
  fun remove(ids: Collection<String>) {
    val kept = all().filter { it.getString("id") !in ids }
    prefs.edit().putString("pending", JSONArray(kept).toString()).apply()
  }

  companion object {
    /**
     * Apps de banca y pago habituales en España.
     * Revisa estos identificadores en Google Play antes de publicar: algunos bancos cambian de app.
     */
    val DEFAULT_PACKAGES = setOf(
      "com.bbva.bbvacontigo",                 // BBVA
      "es.lacaixa.mobile.android.newwapicon", // CaixaBank
      "com.imaginbank.app",                   // imagin
      "es.bancosantander.apps",               // Santander
      "es.openbank.mobile",                   // Openbank
      "www.ingdirect.nativeframe",            // ING
      "com.bankinter.launcher",               // Bankinter
      "net.inverline.bancosabadell.officelocator.android", // Sabadell
      "com.revolut.revolut",                  // Revolut
      "de.number26.android",                  // N26
      "com.google.android.apps.walletnfcrel", // Google Wallet
    )
  }
}
