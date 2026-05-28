// Yazıcı işlemlerini merkezi yönetmek için oluşturuldu.
// İleride gerçek ESC/POS veya fiziksel yazıcı entegrasyonu yapılırsa tüm yazdırma işlemleri burada toplanacak.

export async function sendToPrinter(type, payload) {
  return {
    success: true,
    type,
    payload
  };
}