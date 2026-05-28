// Baskı kuyruğu yönetimi için oluşturuldu.
// Aynı anda birden fazla baskı isteği gelirse sıraya almak, tekrar eden işleri önlemek ve stabil çalışmayı sağlamak amacıyla eklendi.

const queue = [];

export function addToQueue(job) {
  queue.push(job);
}

export function getQueue() {
  return queue;
}