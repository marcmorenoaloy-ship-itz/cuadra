package expo.modules.banklistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Recibe las notificaciones de las apps de banco. Si parecen un movimiento (importe + palabra
 * como "pago", "compra" o "recibido"), las guarda y avisa al usuario para que lo clasifique.
 */
class BankNotificationService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName == packageName) return
    val store = CapturedStore(this)
    if (!store.enabled) return
    if (!store.anyApp && sbn.packageName !in store.packages) return

    val extras = sbn.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
    val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
    val full = "$title $text"

    val amount = AMOUNT.find(full)?.groupValues?.get(1) ?: return
    if (!MOVEMENT_WORDS.containsMatchIn(full)) return
    if (PROMO_WORDS.containsMatchIn(full)) return

    val item = store.add(sbn.packageName, title, text, sbn.postTime) ?: return
    val isIncome = INCOME_WORDS.containsMatchIn(full)
    showPrompt(item.getString("id"), amount, isIncome)
    BankListenerModule.instance?.emitCaptured(item)
  }

  private fun showPrompt(id: String, amount: String, isIncome: Boolean) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL, "Movimientos detectados", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "Te avisa cuando detecta un pago o un ingreso para que lo clasifiques"
        }
      )
    }
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("cuadra://clasificar?pendiente=${Uri.encode(id)}"))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val pending = PendingIntent.getActivity(
      this, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName)
      .takeIf { it != 0 } ?: applicationInfo.icon
    val title = if (isIncome) "Te han ingresado $amount €" else "Has pagado $amount €"

    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, CHANNEL)
      else Notification.Builder(this).setPriority(Notification.PRIORITY_HIGH)
    val notification = builder
      .setSmallIcon(icon)
      .setContentTitle(title)
      .setContentText("Toca para clasificarlo en un segundo")
      .setContentIntent(pending)
      .setAutoCancel(true)
      .build()
    nm.notify(id.hashCode(), notification)
  }

  companion object {
    private const val CHANNEL = "cuadra_detectados"
    // 23,40 € · 1.650,00 EUR · €23.40
    private val AMOUNT = Regex("""(?:€\s?)?(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s?(?:€|eur\b|euros\b)""", RegexOption.IGNORE_CASE)
    private val MOVEMENT_WORDS = Regex(
      """pago|pagado|compra|cargo|recibo|adeudo|retirada|reintegro|bizum|transferencia|ingreso|ingresado|recibido|abono|has enviado|nómina|nomina|domiciliaci""",
      RegexOption.IGNORE_CASE
    )
    private val INCOME_WORDS = Regex("""ingreso|ingresado|recibido|abono|te han (enviado|pagado)|nómina|nomina|devoluci""", RegexOption.IGNORE_CASE)
    private val PROMO_WORDS = Regex("""consigue|gana hasta|oferta|promoci|sorteo|descuento de""", RegexOption.IGNORE_CASE)
  }
}
